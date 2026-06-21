#ifndef INTERFAZ_H
#define INTERFAZ_H
#define _XOPEN_SOURCE_EXTENDED 1 
#include "comunes.h"
#include <ncurses.h> 
#include <locale.h>
#include <wchar.h>
#include <string.h>
#include <stdlib.h>

#define C_NORMAL  1
#define C_TITULO  2
#define C_INPUT   3
#define C_ERROR   4
#define C_EXITO   5
#define C_MENU    6
#define C_BORDE   7
#define C_HEADER  8
#define C_ANIM 17

void InitColores(void);
void DibujarMarco(WINDOW *w, const char *titulo);
void MostrarMsg(WINDOW *w, int fila, const char *msg, int color);
int  ObtenerTexto(WINDOW *w, int fila, int col, char *buf, int max, int oculto);
int  MenuSeleccion(WINDOW *w, const char **opciones, int num_opciones, int fila_base, const char *titulo);
WINDOW *CrearVentanaCentrada(int alto, int ancho);
void MostrarBanner(WINDOW *w, int fila);

int PantallaLogin(int rol);
void PantallaCatalogo(int rol);


#endif
 
