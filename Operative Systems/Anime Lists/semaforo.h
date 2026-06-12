/*
 * semaforo.h
 */
#ifndef SEMAFORO_H
#define SEMAFORO_H
#include "comunes.h"
int  CrearSemaforo(key_t llave, int valor_inicial);
int  ObtenerSemaforo(key_t llave);
void SemaforoDown(int semid);
void SemaforoUp(int semid);
void EliminarSemaforo(int semid);
#endif
