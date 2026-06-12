/*
 * archivo.h - Prototipos de gestión de archivos
 */
#ifndef ARCHIVO_H
#define ARCHIVO_H
#include "comunes.h"

int    CargarUsuarios(Usuario *lista, int max);
int    GuardarUsuario(const Usuario *usr);
int    BuscarUsuario(const char *nombre, Usuario *lista, int total, Usuario *encontrado);
int    EliminarUsuarioArchivo(int user_id);
int    SiguienteIdUsuario(void);

int    CargarCatalogo(Anime *lista, int max);
int    GuardarAnime(const Anime *anime);
int    ActualizarCatalogo(Anime *lista, int total);
int    SiguienteIdAnime(void);

int    CargarLista(int user_id, ItemLista *lista, int max);
int    GuardarLista(int user_id, ItemLista *lista, int total);

int    CargarCarrito(int user_id, ItemCarrito *carrito, int max);
int    GuardarCarrito(int user_id, ItemCarrito *carrito, int total);

int    RegistrarVenta(const Venta *venta);
int    CargarVentas(Venta *lista, int max);

void   CrearDirectorios(void);
#endif
