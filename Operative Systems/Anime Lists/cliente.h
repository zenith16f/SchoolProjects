#ifndef CLIENTE_H
#define CLIENTE_H

//#include "comunes.h"
#include "semaforo.h"
#include "memoria.h"
#include "interfaz.h"
#include "cifrado.h"
#include <locale.h>
#include <stdlib.h>

int PantallaRegistro(void);
void PantallaLista(void);
void PantallaCarrito(void);
void PantallaPerfil(void);
void MostrarReqsPass(WINDOW *w, int fila, const char *pass);
int ObtenerPassConReqs(WINDOW *w, int fi, int col, char *buf, int max, int fr);
int ValidarPassFuerte(const char *p);

#endif