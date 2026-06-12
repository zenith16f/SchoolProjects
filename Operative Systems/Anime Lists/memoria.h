/*
 * memoria.h
 */
#ifndef MEMORIA_H
#define MEMORIA_H
#include "comunes.h"
int   CrearMemoriaCompartida(key_t llave, size_t tamano);
int   ObtenerMemoriaCompartida(key_t llave, size_t tamano);
void *AdjuntarMemoria(int shmid);
void  DesvincularMemoria(void *ptr);
void  EliminarMemoria(int shmid);
#endif
