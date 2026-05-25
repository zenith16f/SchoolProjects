/*
 * servidor.c - Servidor del gestor de listas de anime
 * Crea memoria compartida PRIVADA por cada cliente
 */
#include "comunes.h"
#include "semaforo.h"
#include "memoria.h"
#include "archivo.h"
#include "cifrado.h"
#include <stdarg.h>

#define ARCHIVO_LOG "datos/servidor.log"

static int g_shmid_global = -1;
static int g_sem_mutex = -1;
static int g_sem_servidor = -1;
static int g_sem_cliente_resp = -1;
static MemoriaGlobal *g_global = NULL;
static int g_corriendo = 1;
static int g_num_clientes = 0;
static pthread_mutex_t g_archivo_mutex = PTHREAD_MUTEX_INITIALIZER;
static pthread_mutex_t g_log_mutex = PTHREAD_MUTEX_INITIALIZER;

/*
 * RegistrarLog - Escribe una entrada en el archivo de log con timestamp
 * El log es thread-safe gracias a g_log_mutex
 */
void RegistrarLog(const char *formato, ...) {
    FILE *fp;
    time_t ahora;
    struct tm *info_tiempo;
    char timestamp[64];
    va_list args;

    pthread_mutex_lock(&g_log_mutex);

    fp = fopen(ARCHIVO_LOG, "a");
    if (fp) {
        ahora = time(NULL);
        info_tiempo = localtime(&ahora);
        strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", info_tiempo);

        fprintf(fp, "[%s] ", timestamp);
        va_start(args, formato);
        vfprintf(fp, formato, args);
        va_end(args);
        fprintf(fp, "\n");
        fclose(fp);
    }

    pthread_mutex_unlock(&g_log_mutex);
}

/* Info para cada hilo */
typedef struct {
    int shmid_privado;
    int sem_cli;
    int sem_srv;
    int numero;
    int rol;
} InfoHilo;

void Limpiar(int sig) {
    (void)sig;
    printf("\n[Servidor] Cerrando...\n");
    RegistrarLog("SERVIDOR DETENIDO. Clientes atendidos: %d", g_num_clientes);
    g_corriendo = 0;
    if (g_global) { g_global->servidor_activo = 0; DesvincularMemoria(g_global); }
    if (g_sem_mutex != -1) EliminarSemaforo(g_sem_mutex);
    if (g_sem_servidor != -1) EliminarSemaforo(g_sem_servidor);
    if (g_sem_cliente_resp != -1) EliminarSemaforo(g_sem_cliente_resp);
    if (g_shmid_global != -1) EliminarMemoria(g_shmid_global);
    remove(ARCHIVO_SHM); remove(ARCHIVO_SEM);
    printf("[Servidor] Clientes atendidos: %d\n", g_num_clientes);
    exit(0);
}

/* ======================== PROCESAMIENTO DE OPERACIONES ======================== */
void ProcesarOperacion(MemoriaPrivada *mp) {
    Usuario usuarios[200];
    Anime catalogo[MAX_ANIME];
    int total_u, total_c, i;
    Usuario usr_encontrado;
    char hash[MAX_HASH];

    pthread_mutex_lock(&g_archivo_mutex);

    switch (mp->operacion) {

    case OP_LOGIN: {
        total_u = CargarUsuarios(usuarios, 200);
        Sha256String(mp->param_str2, hash);
        if (BuscarUsuario(mp->param_str, usuarios, total_u, &usr_encontrado) &&
            strcmp(usr_encontrado.hash, hash) == 0) {
            mp->respuesta_codigo = RESP_OK;
            mp->usuario_id = usr_encontrado.id;
            strncpy(mp->usuario_nombre, usr_encontrado.usuario, MAX_USER);
            mp->usuario_resp = usr_encontrado;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Bienvenido, %s", usr_encontrado.nombre);
            mp->sesion_activa = 1;
            RegistrarLog("LOGIN exitoso: usuario='%s' (ID: %d, PID: %d)", usr_encontrado.usuario, usr_encontrado.id, mp->cliente_pid);
        } else {
            mp->respuesta_codigo = RESP_AUTH_FAIL;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Usuario o contrasena incorrectos");
            RegistrarLog("LOGIN fallido: usuario='%s' (PID: %d)", mp->param_str, mp->cliente_pid);
        }
        break;
    }

    case OP_REGISTRO: {
        total_u = CargarUsuarios(usuarios, 200);
        if (BuscarUsuario(mp->param_str, usuarios, total_u, NULL)) {
            mp->respuesta_codigo = RESP_USER_EXISTS;
            snprintf(mp->respuesta_msg, MAX_FRASE, "El usuario ya existe");
        } else {
            Usuario nuevo;
            nuevo.id = SiguienteIdUsuario();
            strncpy(nuevo.usuario, mp->param_str, MAX_USER-1);
            Sha256String(mp->param_str2, nuevo.hash);
            strncpy(nuevo.email, mp->param_str3, MAX_EMAIL-1);
            strncpy(nuevo.nombre, mp->param_str, MAX_STR-1); /* nombre = usuario por defecto */
            nuevo.activo = 1;
            if (GuardarUsuario(&nuevo) == 0) {
                mp->respuesta_codigo = RESP_OK;
                snprintf(mp->respuesta_msg, MAX_FRASE, "Registro exitoso. ID: %d", nuevo.id);
                RegistrarLog("REGISTRO: nuevo usuario='%s' (ID: %d, email=%s)", nuevo.usuario, nuevo.id, nuevo.email);
            } else {
                mp->respuesta_codigo = RESP_ERROR;
                snprintf(mp->respuesta_msg, MAX_FRASE, "Error al guardar usuario");
            }
        }
        break;
    }

    case OP_VER_CATALOGO: {
        total_c = CargarCatalogo(catalogo, MAX_ANIME);
        int n = 0;
        for (i = 0; i < total_c && n < MAX_ANIME; i++) {
            if (catalogo[i].activo) {
                mp->animes[n] = catalogo[i];
                n++;
            }
        }
        mp->num_animes = n;
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Catalogo: %d titulos", n);
        break;
    }

    case OP_AGREGAR_LISTA: {
        ItemLista lista[MAX_LISTA];
        int total = CargarLista(mp->usuario_id, lista, MAX_LISTA);
        /* Verificar que no esté ya */
        int existe = 0;
        for (i = 0; i < total; i++) {
            if (lista[i].anime_id == mp->param_int) { existe = 1; break; }
        }
        if (existe) {
            mp->respuesta_codigo = RESP_ERROR;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Ya esta en tu lista");
        } else if (total >= MAX_LISTA) {
            mp->respuesta_codigo = RESP_ERROR;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Lista llena");
        } else {
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

    case OP_VER_LISTA: {
        int total = CargarLista(mp->usuario_id, mp->lista, MAX_LISTA);
        mp->num_lista = total;
        /* Cargar también el catálogo para los títulos */
        mp->num_animes = CargarCatalogo(mp->animes, MAX_ANIME);
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Tu lista: %d titulos", total);
        break;
    }

    case OP_ELIMINAR_LISTA: {
        ItemLista lista[MAX_LISTA];
        int total = CargarLista(mp->usuario_id, lista, MAX_LISTA);
        int encontrado = 0;
        for (i = 0; i < total; i++) {
            if (lista[i].anime_id == mp->param_int) {
                /* Mover el último al lugar del eliminado */
                lista[i] = lista[total - 1];
                total--;
                encontrado = 1;
                break;
            }
        }
        if (encontrado) {
            GuardarLista(mp->usuario_id, lista, total);
            mp->respuesta_codigo = RESP_OK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Eliminado de tu lista");
        } else {
            mp->respuesta_codigo = RESP_NOT_FOUND;
            snprintf(mp->respuesta_msg, MAX_FRASE, "No encontrado en tu lista");
        }
        break;
    }

    case OP_VER_PERFIL: {
        total_u = CargarUsuarios(usuarios, 200);
        for (i = 0; i < total_u; i++) {
            if (usuarios[i].id == mp->usuario_id) {
                mp->usuario_resp = usuarios[i];
                break;
            }
        }
        mp->respuesta_codigo = RESP_OK;
        break;
    }

    case OP_AGREGAR_CARRITO: {
        ItemCarrito carrito[MAX_LISTA];
        int total = CargarCarrito(mp->usuario_id, carrito, MAX_LISTA);
        int existe = 0;
        for (i = 0; i < total; i++) {
            if (carrito[i].anime_id == mp->param_int) {
                carrito[i].cantidad++;
                existe = 1;
                break;
            }
        }
        if (!existe && total < MAX_LISTA) {
            carrito[total].anime_id = mp->param_int;
            carrito[total].cantidad = 1;
            total++;
        }
        GuardarCarrito(mp->usuario_id, carrito, total);
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Agregado al carrito");
        break;
    }

    case OP_VER_CARRITO: {
        mp->num_carrito = CargarCarrito(mp->usuario_id, mp->carrito, MAX_LISTA);
        mp->num_animes = CargarCatalogo(mp->animes, MAX_ANIME);
        mp->respuesta_codigo = RESP_OK;
        break;
    }

    case OP_COMPRAR: {
        ItemCarrito carrito[MAX_LISTA];
        int total = CargarCarrito(mp->usuario_id, carrito, MAX_LISTA);
        Anime cat[MAX_ANIME];
        int total_cat = CargarCatalogo(cat, MAX_ANIME);
        int j;
        for (i = 0; i < total; i++) {
            Venta v;
            v.usuario_id = mp->usuario_id;
            v.anime_id = carrito[i].anime_id;
            v.fecha = time(NULL);
            v.monto = 0;
            for (j = 0; j < total_cat; j++) {
                if (cat[j].id == carrito[i].anime_id) {
                    v.monto = cat[j].precio * carrito[i].cantidad;
                    break;
                }
            }
            RegistrarVenta(&v);
        }
        /* Vaciar carrito */
        GuardarCarrito(mp->usuario_id, carrito, 0);
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Compra realizada: %d items", total);
        RegistrarLog("COMPRA: usuario_id=%d, items=%d", mp->usuario_id, total);
        break;
    }

    /* ======== OPERACIONES DE ADMIN ======== */
    case OP_ADMIN_LOGIN: {
        /* Credenciales predefinidas del admin */
        if (strcmp(mp->param_str, "admin") == 0 && strcmp(mp->param_str2, "admin123") == 0) {
            mp->respuesta_codigo = RESP_OK;
            mp->sesion_activa = 1;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Bienvenido, Administrador");
            RegistrarLog("ADMIN LOGIN exitoso (PID: %d)", mp->cliente_pid);
        } else {
            mp->respuesta_codigo = RESP_AUTH_FAIL;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Credenciales de admin incorrectas");
        }
        break;
    }

    case OP_ADMIN_ADD_ANIME: {
        Anime nuevo;
        nuevo.id = SiguienteIdAnime();
        strncpy(nuevo.titulo, mp->param_str, MAX_STR-1);
        strncpy(nuevo.genero, mp->param_str2, MAX_STR-1);
        nuevo.episodios = mp->param_int;
        nuevo.anio = mp->param_int2;
        nuevo.precio = mp->param_float;
        nuevo.activo = 1;
        GuardarAnime(&nuevo);
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Anime agregado (ID: %d)", nuevo.id);
        RegistrarLog("ADMIN: anime agregado '%s' (ID: %d, genero=%s, eps=%d)", nuevo.titulo, nuevo.id, nuevo.genero, nuevo.episodios);
        break;
    }

    case OP_ADMIN_DEL_ANIME: {
        total_c = CargarCatalogo(catalogo, MAX_ANIME);
        int encontrado = 0;
        for (i = 0; i < total_c; i++) {
            if (catalogo[i].id == mp->param_int) {
                catalogo[i].activo = 0;
                encontrado = 1;
                break;
            }
        }
        if (encontrado) {
            ActualizarCatalogo(catalogo, total_c);
            mp->respuesta_codigo = RESP_OK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Anime eliminado");
        } else {
            mp->respuesta_codigo = RESP_NOT_FOUND;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Anime no encontrado");
        }
        break;
    }

    case OP_ADMIN_VER_USERS: {
        total_u = CargarUsuarios(usuarios, 200);
        /* Enviar los datos como "animes" reutilizando el campo respuesta_msg */
        mp->respuesta_codigo = RESP_OK;
        mp->param_int = total_u;
        mp->respuesta_msg[0] = '\0';
        for (i = 0; i < total_u && i < 20; i++) {
            char linea[256];
            snprintf(linea, sizeof(linea), "%d|%.15s|%.30s|%.30s\n",
                usuarios[i].id, usuarios[i].usuario, usuarios[i].email, usuarios[i].nombre);
            strncat(mp->respuesta_msg, linea, MAX_FRASE - strlen(mp->respuesta_msg) - 1);
        }
        break;
    }

    case OP_ADMIN_DEL_USER: {
        if (EliminarUsuarioArchivo(mp->param_int) == 0) {
            mp->respuesta_codigo = RESP_OK;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Usuario eliminado");
        } else {
            mp->respuesta_codigo = RESP_ERROR;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Error al eliminar");
        }
        break;
    }

    case OP_ADMIN_REPORTE: {
        Venta ventas[1000];
        int total_v = CargarVentas(ventas, 1000);
        float total_monto = 0;
        for (i = 0; i < total_v; i++) total_monto += ventas[i].monto;
        mp->respuesta_codigo = RESP_OK;
        mp->param_int = total_v;
        mp->param_float = total_monto;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Ventas: %d, Total: $%.2f", total_v, total_monto);
        break;
    }

    default:
        mp->respuesta_codigo = RESP_ERROR;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Operacion desconocida");
        break;
    }

    pthread_mutex_unlock(&g_archivo_mutex);
}

/* ======================== HILO POR CLIENTE ======================== */
void *HiloCliente(void *arg) {
    InfoHilo *info = (InfoHilo *)arg;
    MemoriaPrivada *mp = (MemoriaPrivada *)AdjuntarMemoria(info->shmid_privado);

    if (!mp) { free(info); return NULL; }

    printf("[Hilo %d] Atendiendo %s (SHM privada: %d)\n",
        info->numero, info->rol == ROL_ADMIN ? "ADMIN" : "CLIENTE", info->shmid_privado);

    while (g_corriendo) {
        /* Esperar solicitud del cliente */
        SemaforoDown(info->sem_cli);
        if (!g_corriendo || mp->operacion == OP_DESCONECTAR) break;

        printf("[Hilo %d] Op: %d de PID %d\n", info->numero, mp->operacion, mp->cliente_pid);

        /* Procesar la operación */
        ProcesarOperacion(mp);

        /* Señalar al cliente que la respuesta está lista */
        SemaforoUp(info->sem_srv);
    }

    printf("[Hilo %d] Cliente desconectado\n", info->numero);
    RegistrarLog("DESCONEXION: cliente #%d (PID: %d)", info->numero, mp->cliente_pid);
    DesvincularMemoria(mp);
    EliminarMemoria(info->shmid_privado);
    EliminarSemaforo(info->sem_cli);
    EliminarSemaforo(info->sem_srv);
    free(info);
    return NULL;
}

/* ======================== MAIN ======================== */
int main(void) {
    key_t llave_shm, llave_mutex, llave_srv, llave_cli_resp;

    printf("=============================================\n");
    printf("  GESTOR DE LISTAS DE ANIME - SERVIDOR\n");
    printf("  PID: %d\n", getpid());
    printf("=============================================\n");

    signal(SIGINT, Limpiar);
    CrearDirectorios();

    fclose(fopen(ARCHIVO_SHM, "w"));
    fclose(fopen(ARCHIVO_SEM, "w"));

    llave_shm = ftok(ARCHIVO_SHM, ID_SHM_GLOBAL);
    llave_mutex = ftok(ARCHIVO_SEM, ID_SEM_MUTEX);
    llave_srv = ftok(ARCHIVO_SEM, ID_SEM_SERVIDOR);
    llave_cli_resp = ftok(ARCHIVO_SEM, ID_SEM_CLIENTE);

    if (llave_shm == -1 || llave_mutex == -1 || llave_srv == -1 || llave_cli_resp == -1) {
        perror("ftok"); exit(1);
    }

    g_shmid_global = CrearMemoriaCompartida(llave_shm, sizeof(MemoriaGlobal));
    if (g_shmid_global == -1) exit(1);

    g_global = (MemoriaGlobal *)AdjuntarMemoria(g_shmid_global);
    if (!g_global) exit(1);

    memset(g_global, 0, sizeof(MemoriaGlobal));
    g_global->servidor_activo = 1;

    g_sem_mutex = CrearSemaforo(llave_mutex, 1);
    g_sem_servidor = CrearSemaforo(llave_srv, 0);
    g_sem_cliente_resp = CrearSemaforo(llave_cli_resp, 0);

    if (g_sem_mutex == -1 || g_sem_servidor == -1 || g_sem_cliente_resp == -1) {
        Limpiar(0); exit(1);
    }

    printf("[Servidor] Recursos IPC creados\n");
    printf("[Servidor] Esperando conexiones... (Ctrl+C para salir)\n\n");
    RegistrarLog("SERVIDOR INICIADO (PID: %d)", getpid());

    while (g_corriendo) {
        /* Esperar solicitud de conexión */
        SemaforoDown(g_sem_servidor);
        if (!g_corriendo) break;

        g_num_clientes++;
        SemaforoDown(g_sem_mutex);

        /* Crear memoria compartida PRIVADA para este cliente */
        key_t llave_priv = ftok(ARCHIVO_SHM, (char)(g_num_clientes + 64));
        int shmid_priv = CrearMemoriaCompartida(llave_priv, sizeof(MemoriaPrivada));
        MemoriaPrivada *mp_priv = (MemoriaPrivada *)AdjuntarMemoria(shmid_priv);
        memset(mp_priv, 0, sizeof(MemoriaPrivada));
        mp_priv->cliente_pid = g_global->cliente_pid;

        /* Crear semáforos privados */
        key_t llave_sc = ftok(ARCHIVO_SEM, (char)(g_num_clientes + 64));
        key_t llave_ss = ftok(ARCHIVO_SEM, (char)(g_num_clientes + 96));
        int sem_cli = CrearSemaforo(llave_sc, 0);
        int sem_srv = CrearSemaforo(llave_ss, 0);

        /* Informar al cliente de su memoria privada */
        g_global->llave_privada = llave_priv;
        g_global->sem_cli_listo = sem_cli;
        g_global->sem_srv_listo = sem_srv;

        printf("[Servidor] Cliente #%d (PID: %d, Rol: %s) -> SHM privada: %d\n",
            g_num_clientes, g_global->cliente_pid,
            g_global->rol == ROL_ADMIN ? "ADMIN" : "CLIENTE", shmid_priv);
        RegistrarLog("CONEXION: cliente #%d (PID: %d, Rol: %s, SHM: %d)",
            g_num_clientes, g_global->cliente_pid,
            g_global->rol == ROL_ADMIN ? "ADMIN" : "CLIENTE", shmid_priv);

        SemaforoUp(g_sem_mutex);

        /* Notificar al cliente que puede continuar */
        SemaforoUp(g_sem_cliente_resp);

        /* Crear hilo */
        InfoHilo *info = (InfoHilo *)malloc(sizeof(InfoHilo));
        info->shmid_privado = shmid_priv;
        info->sem_cli = sem_cli;
        info->sem_srv = sem_srv;
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
