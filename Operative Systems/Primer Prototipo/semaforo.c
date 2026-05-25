/*
 * semaforo.c
 */
#include "comunes.h"

int CrearSemaforo(key_t llave, int valor_inicial) {
    int semid = semget(llave, 1, IPC_CREAT | PERMISOS);
    if (semid == -1) { perror("[Sem] Error semget"); return -1; }
    if (semctl(semid, 0, SETVAL, valor_inicial) == -1) { perror("[Sem] Error SETVAL"); return -1; }
    return semid;
}

int ObtenerSemaforo(key_t llave) {
    int semid = semget(llave, 1, 0);
    if (semid == -1) { perror("[Sem] Error obtener"); return -1; }
    return semid;
}

void SemaforoDown(int semid) {
    struct sembuf op = {0, -1, 0};
    if (semop(semid, &op, 1) == -1) { perror("[Sem] Down"); exit(EXIT_FAILURE); }
}

void SemaforoUp(int semid) {
    struct sembuf op = {0, +1, 0};
    if (semop(semid, &op, 1) == -1) { perror("[Sem] Up"); exit(EXIT_FAILURE); }
}

void EliminarSemaforo(int semid) {
    semctl(semid, 0, IPC_RMID);
}
