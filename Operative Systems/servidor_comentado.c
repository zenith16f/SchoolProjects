/*
 * servidor_comentado.c - Servidor del gestor de listas de anime
 * VERSIÓN CON COMENTARIOS PARA ESTUDIO - NO ENTREGAR
 *
 * ARQUITECTURA GENERAL:
 * El servidor es un proceso que se ejecuta en una terminal. Su trabajo es:
 *   1. Crear los recursos IPC (memoria compartida global + semáforos)
 *   2. Esperar en un bucle infinito a que un cliente/admin se conecte
 *   3. Cuando alguien se conecta, crear una MEMORIA COMPARTIDA PRIVADA
 *      exclusiva para esa conexión (esto es lo que el profesor preguntará)
 *   4. Crear un HILO dedicado para atender a ese cliente
 *   5. El hilo procesa las operaciones (login, ver catálogo, etc.)
 *      leyendo/escribiendo en la memoria compartida privada
 *   6. Al terminar, el hilo limpia los recursos privados
 *
 * PREGUNTA DEL PROFESOR: ¿Dónde están los semáforos?
 * RESPUESTA: Hay 3 semáforos GLOBALES para la conexión inicial:
 *   - g_sem_mutex: protege la sección crítica al escribir en la memoria global
 *   - g_sem_servidor: el cliente hace Up para avisar al servidor que quiere conectarse
 *   - g_sem_cliente_resp: el servidor hace Up para avisar al cliente que ya tiene su SHM privada
 * Y hay 2 semáforos PRIVADOS por cada cliente conectado:
 *   - sem_cli: el cliente hace Up cuando tiene una operación lista
 *   - sem_srv: el servidor hace Up cuando tiene la respuesta lista
 *
 * PREGUNTA DEL PROFESOR: ¿Dónde están los hilos?
 * RESPUESTA: En la función HiloCliente(). Se crea uno por cada conexión
 *   con pthread_create() y se detacha con pthread_detach() para que
 *   libere sus recursos al terminar sin necesidad de pthread_join().
 *
 * PREGUNTA DEL PROFESOR: ¿Dónde está la memoria compartida?
 * RESPUESTA: Hay DOS niveles:
 *   - MemoriaGlobal: un solo segmento que todos los clientes usan para
 *     la conexión inicial (handshake). Solo contiene la solicitud de conexión.
 *   - MemoriaPrivada: un segmento EXCLUSIVO por cada cliente-hilo.
 *     Contiene la operación, los parámetros, la respuesta, los datos
 *     del catálogo, la lista personal, el carrito, etc.
 */

#include "comunes.h"
#include "semaforo.h"
#include "memoria.h"
#include "archivo.h"
#include "cifrado.h"

/* ================================================================
 * VARIABLES GLOBALES DEL SERVIDOR
 * Son static para que solo sean visibles en este archivo.
 * ================================================================ */
static int g_shmid_global = -1;       /* ID del segmento de memoria compartida global */
static int g_sem_mutex = -1;          /* Semáforo mutex para proteger la sección crítica */
static int g_sem_servidor = -1;       /* Semáforo: el cliente avisa al servidor que quiere conectarse */
static int g_sem_cliente_resp = -1;   /* Semáforo: el servidor avisa al cliente que ya tiene SHM privada */
static MemoriaGlobal *g_global = NULL; /* Puntero a la memoria compartida global */
static int g_corriendo = 1;           /* Bandera para controlar el bucle principal */
static int g_num_clientes = 0;        /* Contador de clientes atendidos */

/* Mutex de pthreads para proteger el acceso a archivos.
 * Los semáforos System V sincronizan ENTRE procesos (cliente<->servidor),
 * pero este mutex sincroniza ENTRE hilos del servidor, porque múltiples
 * hilos podrían intentar leer/escribir el mismo archivo simultáneamente. */
static pthread_mutex_t g_archivo_mutex = PTHREAD_MUTEX_INITIALIZER;

/* Estructura que se pasa a cada hilo con la información de su conexión */
typedef struct {
    int shmid_privado;  /* ID del segmento de memoria compartida privada */
    int sem_cli;        /* Semáforo privado: cliente tiene datos listos */
    int sem_srv;        /* Semáforo privado: servidor tiene respuesta */
    int numero;         /* Número secuencial del cliente */
    int rol;            /* ROL_CLIENTE o ROL_ADMIN */
} InfoHilo;

/* ================================================================
 * MANEJADOR DE SEÑAL (Ctrl+C)
 * Cuando el usuario presiona Ctrl+C, esta función se ejecuta.
 * Libera TODOS los recursos IPC para no dejarlos huérfanos.
 * ================================================================ */
void Limpiar(int sig) {
    (void)sig; /* Ignorar el número de señal, no lo necesitamos */
    printf("\n[Servidor] Cerrando...\n");
    g_corriendo = 0;

    /* Marcar el servidor como inactivo para que los clientes lo detecten */
    if (g_global) {
        g_global->servidor_activo = 0;
        DesvincularMemoria(g_global);
    }

    /* Eliminar semáforos globales */
    if (g_sem_mutex != -1) EliminarSemaforo(g_sem_mutex);
    if (g_sem_servidor != -1) EliminarSemaforo(g_sem_servidor);
    if (g_sem_cliente_resp != -1) EliminarSemaforo(g_sem_cliente_resp);

    /* Eliminar memoria compartida global */
    if (g_shmid_global != -1) EliminarMemoria(g_shmid_global);

    /* Eliminar archivos auxiliares de ftok */
    remove(ARCHIVO_SHM);
    remove(ARCHIVO_SEM);

    printf("[Servidor] Clientes atendidos: %d\n", g_num_clientes);
    exit(0);
}

/* ================================================================
 * PROCESAMIENTO DE OPERACIONES
 * Esta función es el "cerebro" del servidor. Recibe un puntero a
 * la memoria compartida privada del cliente, lee qué operación
 * pidió (mp->operacion), la ejecuta, y escribe la respuesta.
 *
 * IMPORTANTE: Todo el acceso a archivos está protegido por
 * pthread_mutex_lock/unlock para evitar que dos hilos lean/escriban
 * el mismo archivo al mismo tiempo.
 * ================================================================ */
void ProcesarOperacion(MemoriaPrivada *mp) {
    Usuario usuarios[200];
    Anime catalogo[MAX_ANIME];
    int total_u, total_c, i;
    Usuario usr_encontrado;
    char hash[MAX_HASH];

    /* Proteger acceso a archivos entre hilos */
    pthread_mutex_lock(&g_archivo_mutex);

    switch (mp->operacion) {

    /* ---- LOGIN ----
     * El cliente envía: param_str = usuario, param_str2 = contraseña (texto plano)
     * El servidor: cifra la contraseña con SHA-256, busca en usuarios.dat,
     *   compara el hash, y si coincide marca la sesión como activa. */
    case OP_LOGIN: {
        total_u = CargarUsuarios(usuarios, 200);
        Sha256String(mp->param_str2, hash); /* Cifrar la contraseña recibida */
        if (BuscarUsuario(mp->param_str, usuarios, total_u, &usr_encontrado) &&
            strcmp(usr_encontrado.hash, hash) == 0) {
            mp->respuesta_codigo = RESP_OK;
            mp->usuario_id = usr_encontrado.id;
            strncpy(mp->usuario_nombre, usr_encontrado.usuario, MAX_USER);
            mp->usuario_resp = usr_encontrado;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Bienvenido, %s", usr_encontrado.nombre);
            mp->sesion_activa = 1;
        } else {
            mp->respuesta_codigo = RESP_AUTH_FAIL;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Usuario o contrasena incorrectos");
        }
        break;
    }

    /* ---- REGISTRO ----
     * El cliente envía: param_str=usuario, param_str2=contraseña, param_str3=email
     * El servidor: verifica que no exista, cifra la contraseña, guarda en archivo */
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
            strncpy(nuevo.nombre, mp->param_str, MAX_STR-1);
            nuevo.activo = 1;
            if (GuardarUsuario(&nuevo) == 0) {
                mp->respuesta_codigo = RESP_OK;
                snprintf(mp->respuesta_msg, MAX_FRASE, "Registro exitoso. ID: %d", nuevo.id);
            } else {
                mp->respuesta_codigo = RESP_ERROR;
                snprintf(mp->respuesta_msg, MAX_FRASE, "Error al guardar usuario");
            }
        }
        break;
    }

    /* ---- VER CATÁLOGO ----
     * No necesita parámetros. Lee catalogo.dat y llena el arreglo mp->animes[] */
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

    /* ---- AGREGAR A LISTA PERSONAL ----
     * param_int = ID del anime a agregar
     * Lee la lista del usuario, verifica que no esté duplicado, agrega y guarda */
    case OP_AGREGAR_LISTA: {
        ItemLista lista[MAX_LISTA];
        int total = CargarLista(mp->usuario_id, lista, MAX_LISTA);
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

    /* ---- VER LISTA PERSONAL ----
     * Carga la lista del usuario Y el catálogo (para mostrar los títulos) */
    case OP_VER_LISTA: {
        int total = CargarLista(mp->usuario_id, mp->lista, MAX_LISTA);
        mp->num_lista = total;
        mp->num_animes = CargarCatalogo(mp->animes, MAX_ANIME);
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Tu lista: %d titulos", total);
        break;
    }

    /* ---- ELIMINAR DE LISTA ----
     * param_int = ID del anime a eliminar */
    case OP_ELIMINAR_LISTA: {
        ItemLista lista[MAX_LISTA];
        int total = CargarLista(mp->usuario_id, lista, MAX_LISTA);
        int encontrado = 0;
        for (i = 0; i < total; i++) {
            if (lista[i].anime_id == mp->param_int) {
                lista[i] = lista[total - 1]; /* Mover último al hueco */
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

    /* ---- VER PERFIL ---- */
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

    /* ---- AGREGAR AL CARRITO ---- */
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

    /* ---- VER CARRITO ---- */
    case OP_VER_CARRITO: {
        mp->num_carrito = CargarCarrito(mp->usuario_id, mp->carrito, MAX_LISTA);
        mp->num_animes = CargarCatalogo(mp->animes, MAX_ANIME);
        mp->respuesta_codigo = RESP_OK;
        break;
    }

    /* ---- COMPRAR (procesar carrito) ----
     * Lee cada item del carrito, busca su precio en el catálogo,
     * registra una venta por cada item, y vacía el carrito */
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
        GuardarCarrito(mp->usuario_id, carrito, 0); /* Vaciar carrito */
        mp->respuesta_codigo = RESP_OK;
        snprintf(mp->respuesta_msg, MAX_FRASE, "Compra realizada: %d items", total);
        break;
    }

    /* ======== OPERACIONES DE ADMINISTRADOR ======== */

    /* ---- LOGIN ADMIN (credenciales fijas) ---- */
    case OP_ADMIN_LOGIN: {
        if (strcmp(mp->param_str, "admin") == 0 && strcmp(mp->param_str2, "admin123") == 0) {
            mp->respuesta_codigo = RESP_OK;
            mp->sesion_activa = 1;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Bienvenido, Administrador");
        } else {
            mp->respuesta_codigo = RESP_AUTH_FAIL;
            snprintf(mp->respuesta_msg, MAX_FRASE, "Credenciales de admin incorrectas");
        }
        break;
    }

    /* ---- AGREGAR ANIME AL CATÁLOGO ---- */
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
        break;
    }

    /* ---- ELIMINAR ANIME (marcar como inactivo) ---- */
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

    /* ---- VER USUARIOS ---- */
    case OP_ADMIN_VER_USERS: {
        total_u = CargarUsuarios(usuarios, 200);
        mp->respuesta_codigo = RESP_OK;
        mp->param_int = total_u;
        snprintf(mp->respuesta_msg, MAX_FRASE, "");
        for (i = 0; i < total_u && i < 20; i++) {
            char linea[128];
            snprintf(linea, sizeof(linea), "%d|%s|%s|%s\n",
                usuarios[i].id, usuarios[i].usuario, usuarios[i].email, usuarios[i].nombre);
            strncat(mp->respuesta_msg, linea, MAX_FRASE - strlen(mp->respuesta_msg) - 1);
        }
        break;
    }

    /* ---- ELIMINAR USUARIO ---- */
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

    /* ---- REPORTE DE VENTAS ---- */
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

/* ================================================================
 * HILO POR CLIENTE
 * Esta función es ejecutada por cada hilo creado. Recibe un puntero
 * a InfoHilo que contiene los IDs de la SHM privada y los semáforos.
 *
 * FLUJO:
 *   1. Adjunta la memoria compartida privada
 *   2. Entra en un bucle: espera operación → procesa → envía respuesta
 *   3. Sale del bucle cuando el cliente envía OP_DESCONECTAR
 *   4. Limpia los recursos privados (SHM + semáforos)
 * ================================================================ */
void *HiloCliente(void *arg) {
    InfoHilo *info = (InfoHilo *)arg;

    /* Adjuntar la memoria compartida PRIVADA de este cliente */
    MemoriaPrivada *mp = (MemoriaPrivada *)AdjuntarMemoria(info->shmid_privado);
    if (!mp) { free(info); return NULL; }

    printf("[Hilo %d] Atendiendo %s (SHM privada: %d)\n",
        info->numero, info->rol == ROL_ADMIN ? "ADMIN" : "CLIENTE",
        info->shmid_privado);

    /* Bucle de atención: procesar operaciones hasta desconexión */
    while (g_corriendo) {
        /* AQUÍ ESTÁ EL SEMÁFORO PRIVADO:
         * El hilo se BLOQUEA esperando que el cliente escriba una operación
         * en la memoria compartida privada y haga SemaforoUp(sem_cli) */
        SemaforoDown(info->sem_cli);

        /* Verificar si debe terminar */
        if (!g_corriendo || mp->operacion == OP_DESCONECTAR) break;

        printf("[Hilo %d] Op: %d de PID %d\n",
            info->numero, mp->operacion, mp->cliente_pid);

        /* Procesar la operación (lee de mp, escribe respuesta en mp) */
        ProcesarOperacion(mp);

        /* AQUÍ ESTÁ EL OTRO SEMÁFORO PRIVADO:
         * El hilo avisa al cliente que la respuesta está lista */
        SemaforoUp(info->sem_srv);
    }

    /* Limpiar recursos privados de este cliente */
    printf("[Hilo %d] Cliente desconectado\n", info->numero);
    DesvincularMemoria(mp);
    EliminarMemoria(info->shmid_privado);   /* Destruir SHM privada */
    EliminarSemaforo(info->sem_cli);         /* Destruir semáforo privado */
    EliminarSemaforo(info->sem_srv);         /* Destruir semáforo privado */
    free(info);
    return NULL;
}

/* ================================================================
 * MAIN - BUCLE PRINCIPAL DEL SERVIDOR
 * ================================================================ */
int main(void) {
    key_t llave_shm, llave_mutex, llave_srv, llave_cli_resp;

    printf("=============================================\n");
    printf("  GESTOR DE LISTAS DE ANIME - SERVIDOR\n");
    printf("  PID: %d\n", getpid());
    printf("=============================================\n");

    /* Registrar manejador de Ctrl+C */
    signal(SIGINT, Limpiar);

    /* Crear directorios para archivos de datos */
    CrearDirectorios();

    /* Crear archivos necesarios para ftok
     * ftok necesita que exista un archivo real en disco */
    fclose(fopen(ARCHIVO_SHM, "w"));
    fclose(fopen(ARCHIVO_SEM, "w"));

    /* Generar claves IPC con ftok
     * ftok(archivo, caracter) → clave numérica única
     * Si el cliente usa los mismos argumentos, obtiene la misma clave */
    llave_shm = ftok(ARCHIVO_SHM, ID_SHM_GLOBAL);
    llave_mutex = ftok(ARCHIVO_SEM, ID_SEM_MUTEX);
    llave_srv = ftok(ARCHIVO_SEM, ID_SEM_SERVIDOR);
    llave_cli_resp = ftok(ARCHIVO_SEM, ID_SEM_CLIENTE);

    if (llave_shm == -1 || llave_mutex == -1 || llave_srv == -1 || llave_cli_resp == -1) {
        perror("ftok"); exit(1);
    }

    /* Crear MEMORIA COMPARTIDA GLOBAL
     * Este segmento solo se usa para el handshake de conexión.
     * Contiene: servidor_activo, PID del cliente, rol, y la clave de la SHM privada */
    g_shmid_global = CrearMemoriaCompartida(llave_shm, sizeof(MemoriaGlobal));
    if (g_shmid_global == -1) exit(1);

    g_global = (MemoriaGlobal *)AdjuntarMemoria(g_shmid_global);
    if (!g_global) exit(1);

    memset(g_global, 0, sizeof(MemoriaGlobal));
    g_global->servidor_activo = 1;

    /* Crear SEMÁFOROS GLOBALES */
    g_sem_mutex = CrearSemaforo(llave_mutex, 1);        /* Mutex: empieza en 1 (libre) */
    g_sem_servidor = CrearSemaforo(llave_srv, 0);       /* Servidor: empieza en 0 (bloqueado) */
    g_sem_cliente_resp = CrearSemaforo(llave_cli_resp, 0); /* Cliente: empieza en 0 (bloqueado) */

    if (g_sem_mutex == -1 || g_sem_servidor == -1 || g_sem_cliente_resp == -1) {
        Limpiar(0); exit(1);
    }

    printf("[Servidor] Recursos IPC creados\n");
    printf("[Servidor] Esperando conexiones... (Ctrl+C para salir)\n\n");

    /* ================================================================
     * BUCLE PRINCIPAL DE CONEXIONES
     * El servidor se bloquea en SemaforoDown(g_sem_servidor) esperando
     * que un cliente haga SemaforoUp(g_sem_servidor) para conectarse.
     * ================================================================ */
    while (g_corriendo) {
        /* BLOQUEO: esperar que un cliente solicite conexión */
        SemaforoDown(g_sem_servidor);
        if (!g_corriendo) break;

        g_num_clientes++;

        /* Leer datos del cliente de la memoria global (protegido por mutex) */
        SemaforoDown(g_sem_mutex);

        /* ========================================================
         * CREACIÓN DE MEMORIA COMPARTIDA PRIVADA
         * Cada cliente obtiene su propio segmento de SHM.
         * Se usa ftok con un carácter diferente para cada cliente
         * (basado en g_num_clientes) para generar claves únicas.
         * ======================================================== */
        key_t llave_priv = ftok(ARCHIVO_SHM, (char)(g_num_clientes + 64));
        int shmid_priv = CrearMemoriaCompartida(llave_priv, sizeof(MemoriaPrivada));
        MemoriaPrivada *mp_priv = (MemoriaPrivada *)AdjuntarMemoria(shmid_priv);
        memset(mp_priv, 0, sizeof(MemoriaPrivada));
        mp_priv->cliente_pid = g_global->cliente_pid;

        /* Crear semáforos PRIVADOS para esta conexión */
        key_t llave_sc = ftok(ARCHIVO_SEM, (char)(g_num_clientes + 64));
        key_t llave_ss = ftok(ARCHIVO_SEM, (char)(g_num_clientes + 96));
        int sem_cli = CrearSemaforo(llave_sc, 0);  /* Cliente→Servidor: empieza bloqueado */
        int sem_srv = CrearSemaforo(llave_ss, 0);  /* Servidor→Cliente: empieza bloqueado */

        /* Informar al cliente cuál es su SHM privada y sus semáforos */
        g_global->llave_privada = llave_priv;
        g_global->sem_cli_listo = sem_cli;
        g_global->sem_srv_listo = sem_srv;

        printf("[Servidor] Cliente #%d (PID: %d, Rol: %s) -> SHM privada: %d\n",
            g_num_clientes, g_global->cliente_pid,
            g_global->rol == ROL_ADMIN ? "ADMIN" : "CLIENTE", shmid_priv);

        SemaforoUp(g_sem_mutex);

        /* Notificar al cliente que ya puede leer su SHM privada */
        SemaforoUp(g_sem_cliente_resp);

        /* ========================================================
         * CREACIÓN DEL HILO
         * Se crea un hilo dedicado para atender a este cliente.
         * pthread_detach permite que el hilo libere sus recursos
         * al terminar sin necesidad de pthread_join.
         * ======================================================== */
        InfoHilo *info = (InfoHilo *)malloc(sizeof(InfoHilo));
        info->shmid_privado = shmid_priv;
        info->sem_cli = sem_cli;
        info->sem_srv = sem_srv;
        info->numero = g_num_clientes;
        info->rol = g_global->rol;

        pthread_t hilo;
        pthread_create(&hilo, NULL, HiloCliente, info);
        pthread_detach(hilo);

        /* El servidor desvincula su copia de la SHM privada
         * (el hilo tiene su propia copia adjuntada) */
        DesvincularMemoria(mp_priv);
    }

    Limpiar(0);
    return 0;
}
