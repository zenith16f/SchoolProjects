/*
 * memoria.c
 */
#include "comunes.h"

int CrearMemoriaCompartida(key_t llave, size_t tamano) {
    int shmid = shmget(llave, tamano, IPC_CREAT | PERMISOS);
    if (shmid == -1) { perror("[Mem] Error shmget"); return -1; }
    return shmid;
}

int ObtenerMemoriaCompartida(key_t llave, size_t tamano) {
    int shmid = shmget(llave, tamano, 0);
    if (shmid == -1) { perror("[Mem] Error obtener"); return -1; }
    return shmid;
}

void *AdjuntarMemoria(int shmid) {
    void *ptr = shmat(shmid, NULL, 0);
    if (ptr == (void *)-1) { perror("[Mem] Error shmat"); return NULL; }
    return ptr;
}

void DesvincularMemoria(void *ptr) {
    if (shmdt(ptr) == -1) perror("[Mem] Error shmdt");
}

void EliminarMemoria(int shmid) {
    shmctl(shmid, IPC_RMID, NULL);
}
