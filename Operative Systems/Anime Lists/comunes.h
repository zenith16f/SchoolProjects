/*
 * comunes.h - Estructuras y constantes del sistema gestor de anime
 * Prototipo Final - Sistemas Operativos - ESCOM IPN - Grupo 4CV4
 */
#ifndef COMUNES_H
#define COMUNES_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/ipc.h>
#include <sys/shm.h>
#include <sys/sem.h>
#include <pthread.h>
#include <signal.h>
#include <ctype.h>
#include <time.h>

#define MAX_STR         128
#define MAX_FRASE       512
#define MAX_USER        32
#define MAX_PASS        64
#define MAX_HASH        65
#define MAX_EMAIL       64
#define MAX_NOMBRE      64
#define MAX_ANIME       200
#define MAX_LISTA       50
#define MAX_CLIENTES    50
#define PERMISOS        0644

#define ARCHIVO_SHM     "ipc_shm"
#define ARCHIVO_SEM     "ipc_sem"

#define ID_SHM_GLOBAL   'G'
#define ID_SEM_MUTEX    'S'
#define ID_SEM_SERVIDOR 'V'
#define ID_SEM_CLIENTE  'C'

#define ARCHIVO_USUARIOS    "datos/usuarios.dat"
#define ARCHIVO_CATALOGO    "datos/catalogo.dat"
#define ARCHIVO_VENTAS      "datos/ventas.dat"
#define ARCHIVO_LOG         "datos/servidor.log"
#define DIR_LISTAS          "datos/listas/"
#define DIR_CARRITOS        "datos/carritos/"

/* Operaciones cliente */
#define OP_NADA             0
#define OP_LOGIN            1
#define OP_REGISTRO         2
#define OP_VER_CATALOGO     3
#define OP_AGREGAR_LISTA    4
#define OP_VER_LISTA        5
#define OP_ELIMINAR_LISTA   6
#define OP_EDITAR_LISTA     7
#define OP_VER_PERFIL       8
#define OP_MODIFICAR_PERFIL 9
#define OP_AGREGAR_CARRITO  10
#define OP_VER_CARRITO      11
#define OP_COMPRAR          12
#define OP_DESCONECTAR      99

/* Operaciones admin */
#define OP_ADMIN_LOGIN       101
#define OP_ADMIN_ADD_ANIME   102
#define OP_ADMIN_DEL_ANIME   103
#define OP_ADMIN_MOD_ANIME   104
#define OP_ADMIN_VER_USERS   105
#define OP_ADMIN_DEL_USER    106
#define OP_ADMIN_REPORTE     107
#define OP_ADMIN_REPORTE_D   108
#define OP_ADMIN_REPORTE_S   109
#define OP_ADMIN_REPORTE_M   110

/* Respuestas */
#define RESP_OK             0
#define RESP_ERROR          1
#define RESP_USER_EXISTS    2
#define RESP_AUTH_FAIL      3
#define RESP_NOT_FOUND      4
#define RESP_NO_STOCK       5

/* Roles */
#define ROL_CLIENTE     0
#define ROL_ADMIN       1

/* Estados de anime */
#define ESTADO_PLAN     0
#define ESTADO_VIENDO   1
#define ESTADO_COMPLETO 2
#define ESTADO_PAUSADO  3
#define ESTADO_DROPPED  4

/* ======================== ESTRUCTURAS ======================== */

typedef struct {
    int id;
    char titulo[MAX_STR];
    char genero[MAX_STR];
    int episodios;
    int anio;
    float precio;
    int stock;
    int activo;
} Anime;

typedef struct {
    int id;
    char usuario[MAX_USER];
    char hash[MAX_HASH];
    char email[MAX_EMAIL];
    char nombre[MAX_NOMBRE];
    int activo;
} Usuario;

typedef struct {
    int anime_id;
    int estado;
    int episodio_actual;
    int puntuacion;
} ItemLista;

typedef struct {
    int anime_id;
    int cantidad;
} ItemCarrito;

typedef struct {
    int usuario_id;
    int anime_id;
    float monto;
    int cantidad;
    time_t fecha;
} Venta;

/*
 * MemoriaPrivada - Segmento EXCLUSIVO por cada cliente-hilo.
 * Se crea con IPC_PRIVATE (sin ftok) para soportar N clientes sin límite.
 */
typedef struct {
    int operacion;
    int param_int;
    int param_int2;
    int param_int3;
    char param_str[MAX_STR];
    char param_str2[MAX_STR];
    char param_str3[MAX_STR];
    char param_str4[MAX_NOMBRE];
    float param_float;

    int respuesta_codigo;
    char respuesta_msg[MAX_FRASE];

    Anime animes[MAX_ANIME];
    int num_animes;
    ItemLista lista[MAX_LISTA];
    int num_lista;
    ItemCarrito carrito[MAX_LISTA];
    int num_carrito;
    Usuario usuario_resp;

    pid_t cliente_pid;
    int sesion_activa;
    int usuario_id;
    char usuario_nombre[MAX_USER];
} MemoriaPrivada;

/*
 * MemoriaGlobal - Un solo segmento para el handshake de conexión.
 * Después de conectarse, el cliente usa solo su MemoriaPrivada.
 */
typedef struct {
    int servidor_activo;
    int solicitud_conexion;
    pid_t cliente_pid;
    int rol;
    int shmid_privado;
    int sem_cli_listo;
    int sem_srv_listo;
} MemoriaGlobal;

#endif
