/*
 * servidor.c - Servidor del gestor de listas de anime - Prototipo Final
 * IPC_PRIVATE para N clientes, stock, reportes por período
 */
#include "comunes.h"
#include "semaforo.h"
#include "memoria.h"
#include "archivo.h"
#include "cifrado.h"
#include <stdarg.h>

int g_shmid_global = -1;
static int g_sem_mutex = -1;
static int g_sem_servidor = -1;
static int g_sem_cliente_resp = -1;
static MemoriaGlobal *g_global = NULL;
static int g_corriendo = 1;
static int g_num_clientes = 0;
static pthread_mutex_t g_archivo_mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_mutex_t g_log_mutex = PTHREAD_MUTEX_INITIALIZER;

typedef struct
{
    int shmid_privado;
    int sem_cli;
    int sem_srv;
    int numero;
    int rol;
} InfoHilo;

void RegistrarLog(const char *formato, ...)
{
    FILE *fp;
    time_t ahora;
    struct tm *t;
    char ts[64];
    va_list args;
    pthread_mutex_lock(&g_log_mutex);
    fp = fopen(ARCHIVO_LOG, "a");
    if (fp)
    {
        ahora = time(NULL);
        t = localtime(&ahora);
        strftime(ts, sizeof(ts), "%Y-%m-%d %H:%M:%S", t);
        fprintf(fp, "[%s] ", ts);
        va_start(args, formato);
        vfprintf(fp, formato, args);
        va_end(args);
        fprintf(fp, "\n");
        fclose(fp);
    }
    pthread_mutex_unlock(&g_log_mutex);
}

void Limpiar(int sig)
{
    (void)sig;
    printf("\n[Servidor] Cerrando...\n");
    RegistrarLog("SERVIDOR DETENIDO. Clientes atendidos: %d", g_num_clientes);
    g_corriendo = 0;
    if (g_global)
    {
        g_global->servidor_activo = 0;
        DesvincularMemoria(g_global);
    }
    if (g_sem_mutex != -1)
        EliminarSemaforo(g_sem_mutex);
    if (g_sem_servidor != -1)
        EliminarSemaforo(g_sem_servidor);
    if (g_sem_cliente_resp != -1)
        EliminarSemaforo(g_sem_cliente_resp);
    if (g_shmid_global != -1)
        EliminarMemoria(g_shmid_global);
    remove(ARCHIVO_SHM);
    remove(ARCHIVO_SEM);
    printf("[Servidor] Clientes atendidos: %d\n", g_num_clientes);
    exit(0);
}

/* ======================== PROCESAMIENTO ======================== */
void ProcesarOperacion(MemoriaPrivada *mp)
{
    Usuario usuarios[200];
    Anime catalogo[MAX_ANIME];
    int total_u, total_c, i;
    Usuario usr;
    char hash[MAX_HASH];

    pthread_mutex_lock(&g_archivo_mutex);

    switch (mp->operacion)
    {

    case OP_LOGIN:
    {
        total_u = CargarUsuarios(usuarios, 200);
        Sha256String(mp->param_str2, hash);
        if (BuscarUsuario(mp->param_str, usuarios, total_u, &usr) && strcmp(usr.hash, hash) == 0)
        {
            mp->respuesta_codigo = RESP_OK;
            mp->usuario_id = usr.id;
            strncpy(mp->usuario_nombre, usr.usuario, MAX_USER);
            mp->usuario_resp = usr;
            mp->sesion_activa = 1;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Bienvenido, %s", usr.nombre);
            RegistrarLog("LOGIN: usuario='%s' (ID:%d, PID:%d)", usr.usuario, usr.id, mp->cliente_pid);
        }
        else
        {
            mp->respuesta_codigo = RESP_AUTH_FAIL;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Usuario o contrasena incorrectos");
            RegistrarLog("LOGIN FALLIDO: '%s' (PID:%d)", mp->param_str, mp->cliente_pid);
        }
        break;
    }

    case OP_REGISTRO:
    {
        total_u = CargarUsuarios(usuarios, 200);
        if (BuscarUsuario(mp->param_str, usuarios, total_u, NULL))
        {
            mp->respuesta_codigo = RESP_USER_EXISTS;
            snprintf(mp->respuesta_msg, MAX_FRASE, "El usuario ya existe");
        }
        else
        {
            Usuario nuevo;
            nuevo.id = SiguienteIdUsuario();
            strncpy(nuevo.usuario, mp->param_str, MAX_USER - 1);
            Sha256String(mp->param_str2, nuevo.hash);
            strncpy(nuevo.email, mp->param_str3, MAX_EMAIL - 1);
            strncpy(nuevo.nombre, mp->param_str4, MAX_NOMBRE - 1);
            nuevo.activo = 1;
            if (GuardarUsuario(&nuevo) == 0)
            {
                mp->respuesta_codigo = RESP_OK;
                snprintf(mp->respuesta_msg, MAX_FRASE, "Registro exitoso (ID: %d)", nuevo.id);
                RegistrarLog("REGISTRO: '%s' nombre='%s' (ID:%d)", nuevo.usuario, nuevo.nombre, nuevo.id);
            }
            else
            {
                mp->respuesta_codigo = RESP_ERROR;
                snprintf(mp->respuesta_msg, MAX_FRASE, "Error al guardar");
            }
        }
        break;
    }

    case OP_VER_CATALOGO:
    {
        total_c = CargarCatalogo(catalogo, MAX_ANIME);
        int n = 0;
        for (i = 0; i < total_c && n < MAX_ANIME; i++)
            if (catalogo[i].activo)
                mp->animes[n++] = catalogo[i];
        mp->num_animes = n;
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Catalogo: %d titulos", n);
        break;
    }

    case OP_AGREGAR_LISTA:
    {
        ItemLista lista[MAX_LISTA];
        int total = CargarLista(mp->usuario_id, lista, MAX_LISTA);
        int existe = 0;
        for (i = 0; i < total; i++)
            if (lista[i].anime_id == mp->param_int)
            {
                existe = 1;
                break;
            }
        if (existe)
        {
            mp->respuesta_codigo = RESP_ERROR;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Ya esta en tu lista");
        }
        else if (total >= MAX_LISTA)
        {
            mp->respuesta_codigo = RESP_ERROR;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Lista llena");
        }
        else
        {
            lista[total].anime_id = mp->param_int;
            lista[total].estado = ESTADO_PLAN;
            lista[total].episodio_actual = 0;
            lista[total].puntuacion = 0;
            GuardarLista(mp->usuario_id, lista, total + 1);
            mp->respuesta_codigo = RESP_OK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Agregado a tu lista");
        }
        break;
    }

    case OP_VER_LISTA:
    {
        mp->num_lista = CargarLista(mp->usuario_id, mp->lista, MAX_LISTA);
        mp->num_animes = CargarCatalogo(mp->animes, MAX_ANIME);
        mp->respuesta_codigo = RESP_OK;
        break;
    }

    case OP_ELIMINAR_LISTA:
    {
        ItemLista lista[MAX_LISTA];
        int total = CargarLista(mp->usuario_id, lista, MAX_LISTA), enc = 0;
        for (i = 0; i < total; i++)
        {
            if (lista[i].anime_id == mp->param_int)
            {
                lista[i] = lista[--total];
                enc = 1;
                break;
            }
        }
        if (enc)
        {
            GuardarLista(mp->usuario_id, lista, total);
            mp->respuesta_codigo = RESP_OK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Eliminado de tu lista");
        }
        else
        {
            mp->respuesta_codigo = RESP_NOT_FOUND;
            snprintf(mp->respuesta_msg, MAX_FRASE, "No encontrado");
        }
        break;
    }

    case OP_EDITAR_LISTA:
    {
        ItemLista lista[MAX_LISTA];
        int total = CargarLista(mp->usuario_id, lista, MAX_LISTA), enc = 0;
        for (i = 0; i < total; i++)
        {
            if (lista[i].anime_id == mp->param_int)
            {
                lista[i].estado = mp->param_int2;
                lista[i].episodio_actual = mp->param_int3;
                lista[i].puntuacion = (int)mp->param_float;
                enc = 1;
                break;
            }
        }
        if (enc)
        {
            GuardarLista(mp->usuario_id, lista, total);
            mp->respuesta_codigo = RESP_OK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Lista actualizada");
        }
        else
        {
            mp->respuesta_codigo = RESP_NOT_FOUND;
            snprintf(mp->respuesta_msg, MAX_FRASE, "No encontrado");
        }
        break;
    }

    case OP_VER_PERFIL:
    {
        total_u = CargarUsuarios(usuarios, 200);
        for (i = 0; i < total_u; i++)
            if (usuarios[i].id == mp->usuario_id)
            {
                mp->usuario_resp = usuarios[i];
                break;
            }
        mp->respuesta_codigo = RESP_OK;
        break;
    }

    case OP_MODIFICAR_PERFIL:
    {
        total_u = CargarUsuarios(usuarios, 200);
        int enc = 0;
        for (i = 0; i < total_u; i++)
        {
            if (usuarios[i].id == mp->usuario_id)
            {
                if (strlen(mp->param_str) > 0)
                    strncpy(usuarios[i].nombre, mp->param_str, MAX_NOMBRE - 1);
                if (strlen(mp->param_str2) > 0)
                    strncpy(usuarios[i].email, mp->param_str2, MAX_EMAIL - 1);
                enc = 1;
                break;
            }
        }
        if (enc)
        {
            FILE *fp = fopen(ARCHIVO_USUARIOS, "w");
            if (fp)
            {
                for (i = 0; i < total_u; i++)
                    fprintf(fp, "%d|%s|%s|%s|%s\n", usuarios[i].id, usuarios[i].usuario, usuarios[i].hash, usuarios[i].email, usuarios[i].nombre);
                fclose(fp);
            }
            mp->respuesta_codigo = RESP_OK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Perfil actualizado");
        }
        else
        {
            mp->respuesta_codigo = RESP_ERROR;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Error");
        }
        break;
    }

    case OP_AGREGAR_CARRITO:
    {
        /* Verificar stock */
        total_c = CargarCatalogo(catalogo, MAX_ANIME);
        int tiene_stock = 0;
        for (i = 0; i < total_c; i++)
        {
            if (catalogo[i].id == mp->param_int && catalogo[i].activo && catalogo[i].stock > 0)
            {
                tiene_stock = 1;
                break;
            }
        }
        if (!tiene_stock)
        {
            mp->respuesta_codigo = RESP_NO_STOCK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Sin stock disponible");
            break;
        }

        ItemCarrito carrito[MAX_LISTA];
        int total = CargarCarrito(mp->usuario_id, carrito, MAX_LISTA), existe = 0;
        for (i = 0; i < total; i++)
        {
            if (carrito[i].anime_id == mp->param_int)
            {
                carrito[i].cantidad++;
                existe = 1;
                break;
            }
        }
        if (!existe && total < MAX_LISTA)
        {
            carrito[total].anime_id = mp->param_int;
            carrito[total].cantidad = 1;
            total++;
        }
        GuardarCarrito(mp->usuario_id, carrito, total);
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Agregado al carrito");
        break;
    }

    case OP_VER_CARRITO:
    {
        mp->num_carrito = CargarCarrito(mp->usuario_id, mp->carrito, MAX_LISTA);
        mp->num_animes = CargarCatalogo(mp->animes, MAX_ANIME);
        mp->respuesta_codigo = RESP_OK;
        break;
    }

    case OP_COMPRAR:
    {
        ItemCarrito carrito[MAX_LISTA];
        int total = CargarCarrito(mp->usuario_id, carrito, MAX_LISTA);
        Anime cat[MAX_ANIME];
        int total_cat = CargarCatalogo(cat, MAX_ANIME);
        int j, compras_ok = 0;
        for (i = 0; i < total; i++)
        {
            for (j = 0; j < total_cat; j++)
            {
                if (cat[j].id == carrito[i].anime_id && cat[j].stock >= carrito[i].cantidad)
                {
                    Venta v;
                    v.usuario_id = mp->usuario_id;
                    v.anime_id = carrito[i].anime_id;
                    v.monto = cat[j].precio * carrito[i].cantidad;
                    v.cantidad = carrito[i].cantidad;
                    v.fecha = time(NULL);
                    RegistrarVenta(&v);
                    cat[j].stock -= carrito[i].cantidad;
                    compras_ok++;
                    break;
                }
            }
        }
        ActualizarCatalogo(cat, total_cat);
        GuardarCarrito(mp->usuario_id, carrito, 0);
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Compra realizada: %d items", compras_ok);
        RegistrarLog("COMPRA: user_id=%d, items=%d", mp->usuario_id, compras_ok);
        break;
    }

    /* ======== ADMIN ======== */
    case OP_ADMIN_LOGIN:
    {
        if (strcmp(mp->param_str, "admin") == 0 && strcmp(mp->param_str2, "admin123") == 0)
        {
            mp->respuesta_codigo = RESP_OK;
            mp->sesion_activa = 1;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Bienvenido, Administrador");
            RegistrarLog("ADMIN LOGIN (PID:%d)", mp->cliente_pid);
        }
        else
        {
            mp->respuesta_codigo = RESP_AUTH_FAIL;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Credenciales incorrectas");
        }
        break;
    }

    case OP_ADMIN_ADD_ANIME:
    {
        Anime nuevo;
        nuevo.id = SiguienteIdAnime();
        strncpy(nuevo.titulo, mp->param_str, MAX_STR - 1);
        strncpy(nuevo.genero, mp->param_str2, MAX_STR - 1);
        nuevo.episodios = mp->param_int;
        nuevo.anio = mp->param_int2;
        nuevo.precio = mp->param_float;
        nuevo.stock = mp->param_int3;
        nuevo.activo = 1;
        GuardarAnime(&nuevo);
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Anime agregado (ID:%d, stock:%d)", nuevo.id, nuevo.stock);
        RegistrarLog("ADMIN: anime '%s' (ID:%d, stock:%d)", nuevo.titulo, nuevo.id, nuevo.stock);
        break;
    }

    case OP_ADMIN_DEL_ANIME:
    {
        total_c = CargarCatalogo(catalogo, MAX_ANIME);
        int enc = 0;
        for (i = 0; i < total_c; i++)
        {
            if (catalogo[i].id == mp->param_int)
            {
                catalogo[i].activo = 0;
                enc = 1;
                break;
            }
        }
        if (enc)
        {
            ActualizarCatalogo(catalogo, total_c);
            mp->respuesta_codigo = RESP_OK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Anime eliminado");
        }
        else
        {
            mp->respuesta_codigo = RESP_NOT_FOUND;
            snprintf(mp->respuesta_msg, MAX_FRASE, "No encontrado");
        }
        break;
    }

    case OP_ADMIN_MOD_ANIME:
    {
        total_c = CargarCatalogo(catalogo, MAX_ANIME);
        int enc = 0;
        for (i = 0; i < total_c; i++)
        {
            if (catalogo[i].id == mp->param_int)
            {
                if (strlen(mp->param_str) > 0)
                    strncpy(catalogo[i].titulo, mp->param_str, MAX_STR - 1);
                if (strlen(mp->param_str2) > 0)
                    strncpy(catalogo[i].genero, mp->param_str2, MAX_STR - 1);
                if (mp->param_int2 > 0)
                    catalogo[i].episodios = mp->param_int2;
                if (mp->param_float > 0)
                    catalogo[i].precio = mp->param_float;
                if (mp->param_int3 >= 0)
                    catalogo[i].stock = mp->param_int3;
                enc = 1;
                break;
            }
        }
        if (enc)
        {
            ActualizarCatalogo(catalogo, total_c);
            mp->respuesta_codigo = RESP_OK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Anime modificado");
        }
        else
        {
            mp->respuesta_codigo = RESP_NOT_FOUND;
            snprintf(mp->respuesta_msg, MAX_FRASE, "No encontrado");
        }
        break;
    }

    case OP_ADMIN_VER_USERS:
    {
        total_u = CargarUsuarios(usuarios, 200);
        mp->respuesta_codigo = RESP_OK;
        mp->param_int = total_u;
        mp->respuesta_msg[0] = '\0';
        for (i = 0; i < total_u && i < 20; i++)
        {
            char linea[256];
            snprintf(linea, sizeof(linea), "%d|%.15s|%.30s|%.30s\n",
                     usuarios[i].id, usuarios[i].usuario, usuarios[i].email, usuarios[i].nombre);
            strncat(mp->respuesta_msg, linea, MAX_FRASE - strlen(mp->respuesta_msg) - 1);
        }
        break;
    }

    case OP_ADMIN_DEL_USER:
    {
        if (EliminarUsuarioArchivo(mp->param_int) == 0)
        {
            mp->respuesta_codigo = RESP_OK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Usuario eliminado");
        }
        else
        {
            mp->respuesta_codigo = RESP_ERROR;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Error al eliminar");
        }
        break;
    }

    case OP_ADMIN_REPORTE:
    case OP_ADMIN_REPORTE_D:
    case OP_ADMIN_REPORTE_S:
    case OP_ADMIN_REPORTE_M:
    {
        Venta ventas[2000];
        int total_v = CargarVentas(ventas, 2000);
        float total_monto = 0;
        int total_items = 0;
        time_t ahora = time(NULL);
        time_t limite = 0;
        if (mp->operacion == OP_ADMIN_REPORTE_D)
            limite = ahora - 86400;
        else if (mp->operacion == OP_ADMIN_REPORTE_S)
            limite = ahora - 604800;
        else if (mp->operacion == OP_ADMIN_REPORTE_M)
            limite = ahora - 2592000;
        for (i = 0; i < total_v; i++)
        {
            if (mp->operacion == OP_ADMIN_REPORTE || ventas[i].fecha >= limite)
            {
                total_monto += ventas[i].monto;
                total_items += ventas[i].cantidad;
            }
        }
        mp->respuesta_codigo = RESP_OK;
        mp->param_int = total_items;
        mp->param_float = total_monto;
        const char *periodo = "Total";
        if (mp->operacion == OP_ADMIN_REPORTE_D)
            periodo = "Diario";
        else if (mp->operacion == OP_ADMIN_REPORTE_S)
            periodo = "Semanal";
        else if (mp->operacion == OP_ADMIN_REPORTE_M)
            periodo = "Mensual";
        snprintf(mp->respuesta_msg, MAX_FRASE, "Reporte %s: %d items, $%.2f", periodo, total_items, total_monto);
        break;
    }

    default:
        mp->respuesta_codigo = RESP_ERROR;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Operacion desconocida");
        break;
    }

    pthread_mutex_unlock(&g_archivo_mutex);
}

/* ======================== HILO ======================== */
void *HiloCliente(void *arg)
{
    InfoHilo *info = (InfoHilo *)arg;
    MemoriaPrivada *mp = (MemoriaPrivada *)AdjuntarMemoria(info->shmid_privado);
    if (!mp)
    {
        free(info);
        return NULL;
    }

    printf("[Hilo %d] Atendiendo %s (SHM:%d, TID:%lu)\n",
           info->numero, info->rol == ROL_ADMIN ? "ADMIN" : "CLIENTE",
           info->shmid_privado, (unsigned long)pthread_self());

    while (g_corriendo)
    {
        SemaforoDown(info->sem_cli);
        if (!g_corriendo || mp->operacion == OP_DESCONECTAR)
            break;
        printf("[Hilo %d] Op:%d PID:%d\n", info->numero, mp->operacion, mp->cliente_pid);
        ProcesarOperacion(mp);
        SemaforoUp(info->sem_srv);
    }

    printf("[Hilo %d] Desconectado\n", info->numero);
    RegistrarLog("DESCONEXION: cliente #%d (PID:%d)", info->numero, mp->cliente_pid);
    DesvincularMemoria(mp);
    EliminarMemoria(info->shmid_privado);
    EliminarSemaforo(info->sem_cli);
    EliminarSemaforo(info->sem_srv);
    free(info);
    return NULL;
}

/* ======================== MAIN ======================== */
int main(void)
{
    key_t llave_shm, llave_mutex, llave_srv, llave_cli_resp;

    printf("=============================================\n");
    printf("  GESTOR DE LISTAS DE ANIME - SERVIDOR\n");
    printf("  Prototipo Final - PID: %d\n", getpid());
    printf("=============================================\n");

    signal(SIGINT, Limpiar);
    CrearDirectorios();
    fclose(fopen(ARCHIVO_SHM, "w"));
    fclose(fopen(ARCHIVO_SEM, "w"));

    llave_shm = ftok(ARCHIVO_SHM, ID_SHM_GLOBAL);
    llave_mutex = ftok(ARCHIVO_SEM, ID_SEM_MUTEX);
    llave_srv = ftok(ARCHIVO_SEM, ID_SEM_SERVIDOR);
    llave_cli_resp = ftok(ARCHIVO_SEM, ID_SEM_CLIENTE);

    g_shmid_global = CrearMemoriaCompartida(llave_shm, sizeof(MemoriaGlobal));
    if (g_shmid_global == -1)
        exit(1);
    g_global = (MemoriaGlobal *)AdjuntarMemoria(g_shmid_global);
    if (!g_global)
        exit(1);
    memset(g_global, 0, sizeof(MemoriaGlobal));
    g_global->servidor_activo = 1;

    g_sem_mutex = CrearSemaforo(llave_mutex, 1);
    g_sem_servidor = CrearSemaforo(llave_srv, 0);
    g_sem_cliente_resp = CrearSemaforo(llave_cli_resp, 0);

    if (g_sem_mutex == -1 || g_sem_servidor == -1 || g_sem_cliente_resp == -1)
    {
        Limpiar(0);
        exit(1);
    }

    printf("[Servidor] IPC creados. Esperando conexiones...\n");
    printf("[Servidor] Ctrl+C para salir.\n\n");
    RegistrarLog("SERVIDOR INICIADO (PID:%d)", getpid());

    while (g_corriendo)
    {
        SemaforoDown(g_sem_servidor);
        if (!g_corriendo)
            break;
        g_num_clientes++;
        SemaforoDown(g_sem_mutex);

        /*
         * MEMORIA COMPARTIDA PRIVADA CON IPC_PRIVATE
         * shmget(IPC_PRIVATE, ...) crea un segmento con clave única
         * generada por el kernel. No depende de ftok ni de archivos.
         * El servidor pasa el shmid directamente al cliente a través
         * de la MemoriaGlobal. Esto permite N clientes sin límite.
         */
        int shmid_priv = shmget(IPC_PRIVATE, sizeof(MemoriaPrivada), IPC_CREAT | PERMISOS);
        MemoriaPrivada *mp_priv = (MemoriaPrivada *)AdjuntarMemoria(shmid_priv);
        memset(mp_priv, 0, sizeof(MemoriaPrivada));
        mp_priv->cliente_pid = g_global->cliente_pid;

        /* Semáforos privados también con IPC_PRIVATE */
        int sem_cli_key = semget(IPC_PRIVATE, 1, IPC_CREAT | PERMISOS);
        semctl(sem_cli_key, 0, SETVAL, 0);
        int sem_srv_key = semget(IPC_PRIVATE, 1, IPC_CREAT | PERMISOS);
        semctl(sem_srv_key, 0, SETVAL, 0);

        /* Pasar info al cliente */
        g_global->shmid_privado = shmid_priv;
        g_global->sem_cli_listo = sem_cli_key;
        g_global->sem_srv_listo = sem_srv_key;

        printf("[Servidor] Cliente #%d (PID:%d, %s) -> SHM:%d\n",
               g_num_clientes, g_global->cliente_pid,
               g_global->rol == ROL_ADMIN ? "ADMIN" : "CLIENTE", shmid_priv);
        RegistrarLog("CONEXION: #%d PID:%d %s SHM:%d",
                     g_num_clientes, g_global->cliente_pid,
                     g_global->rol == ROL_ADMIN ? "ADMIN" : "CLIENTE", shmid_priv);

        SemaforoUp(g_sem_mutex);
        SemaforoUp(g_sem_cliente_resp);

        InfoHilo *info = (InfoHilo *)malloc(sizeof(InfoHilo));
        info->shmid_privado = shmid_priv;
        info->sem_cli = sem_cli_key;
        info->sem_srv = sem_srv_key;
        info->numero = g_num_clientes;
        info->rol = g_global->rol;

        pthread_t hilo;
        pthread_create(&hilo, NULL, HiloCliente, info);
        pthread_detach(hilo);

        DesvincularMemoria(mp_priv);
    }

    Limpiar(0);
    return 0;
}
