/*
 * archivo.c - Gestión de archivos planos para persistencia
 */
#include "archivo.h"
#include <sys/stat.h>
#include <errno.h>

void CrearDirectorios(void) {
    mkdir("datos", 0755);
    mkdir("datos/listas", 0755);
    mkdir("datos/carritos", 0755);
}

/* ======================== USUARIOS ======================== */
int CargarUsuarios(Usuario *lista, int max) {
    FILE *fp = fopen(ARCHIVO_USUARIOS, "r");
    int total = 0;
    if (!fp) return 0;
    while (total < max && fscanf(fp, "%d|%31[^|]|%64[^|]|%63[^|]|%127[^\n]\n",
        &lista[total].id, lista[total].usuario, lista[total].hash,
        lista[total].email, lista[total].nombre) == 5) {
        lista[total].activo = 1;
        total++;
    }
    fclose(fp);
    return total;
}

int GuardarUsuario(const Usuario *usr) {
    FILE *fp = fopen(ARCHIVO_USUARIOS, "a");
    if (!fp) return -1;
    fprintf(fp, "%d|%s|%s|%s|%s\n", usr->id, usr->usuario, usr->hash, usr->email, usr->nombre);
    fclose(fp);
    return 0;
}

int BuscarUsuario(const char *nombre, Usuario *lista, int total, Usuario *encontrado) {
    int i;
    for (i = 0; i < total; i++) {
        if (strcmp(lista[i].usuario, nombre) == 0 && lista[i].activo) {
            if (encontrado) *encontrado = lista[i];
            return 1;
        }
    }
    return 0;
}

int EliminarUsuarioArchivo(int user_id) {
    Usuario lista[200];
    int total = CargarUsuarios(lista, 200);
    int i;
    FILE *fp = fopen(ARCHIVO_USUARIOS, "w");
    if (!fp) return -1;
    for (i = 0; i < total; i++) {
        if (lista[i].id != user_id) {
            fprintf(fp, "%d|%s|%s|%s|%s\n", lista[i].id, lista[i].usuario, lista[i].hash, lista[i].email, lista[i].nombre);
        }
    }
    fclose(fp);
    return 0;
}

int SiguienteIdUsuario(void) {
    Usuario lista[200];
    int total = CargarUsuarios(lista, 200);
    int max_id = 0, i;
    for (i = 0; i < total; i++)
        if (lista[i].id > max_id) max_id = lista[i].id;
    return max_id + 1;
}

/* ======================== CATÁLOGO ======================== */
int CargarCatalogo(Anime *lista, int max) {
    FILE *fp = fopen(ARCHIVO_CATALOGO, "r");
    int total = 0;
    if (!fp) return 0;
    while (total < max && fscanf(fp, "%d|%127[^|]|%127[^|]|%d|%d|%f|%d\n",
        &lista[total].id, lista[total].titulo, lista[total].genero,
        &lista[total].episodios, &lista[total].anio, &lista[total].precio,
        &lista[total].activo) == 7) {
        total++;
    }
    fclose(fp);
    return total;
}

int GuardarAnime(const Anime *anime) {
    FILE *fp = fopen(ARCHIVO_CATALOGO, "a");
    if (!fp) return -1;
    fprintf(fp, "%d|%s|%s|%d|%d|%.2f|%d\n", anime->id, anime->titulo, anime->genero,
        anime->episodios, anime->anio, anime->precio, anime->activo);
    fclose(fp);
    return 0;
}

int ActualizarCatalogo(Anime *lista, int total) {
    FILE *fp = fopen(ARCHIVO_CATALOGO, "w");
    int i;
    if (!fp) return -1;
    for (i = 0; i < total; i++) {
        fprintf(fp, "%d|%s|%s|%d|%d|%.2f|%d\n", lista[i].id, lista[i].titulo, lista[i].genero,
            lista[i].episodios, lista[i].anio, lista[i].precio, lista[i].activo);
    }
    fclose(fp);
    return 0;
}

int SiguienteIdAnime(void) {
    Anime lista[MAX_ANIME];
    int total = CargarCatalogo(lista, MAX_ANIME);
    int max_id = 0, i;
    for (i = 0; i < total; i++)
        if (lista[i].id > max_id) max_id = lista[i].id;
    return max_id + 1;
}

/* ======================== LISTA PERSONAL ======================== */
int CargarLista(int user_id, ItemLista *lista, int max) {
    char ruta[256];
    FILE *fp;
    int total = 0;
    snprintf(ruta, sizeof(ruta), "%s%d.dat", DIR_LISTAS, user_id);
    fp = fopen(ruta, "r");
    if (!fp) return 0;
    while (total < max && fscanf(fp, "%d|%d|%d|%d\n",
        &lista[total].anime_id, &lista[total].estado,
        &lista[total].episodio_actual, &lista[total].puntuacion) == 4) {
        total++;
    }
    fclose(fp);
    return total;
}

int GuardarLista(int user_id, ItemLista *lista, int total) {
    char ruta[256];
    FILE *fp;
    int i;
    snprintf(ruta, sizeof(ruta), "%s%d.dat", DIR_LISTAS, user_id);
    fp = fopen(ruta, "w");
    if (!fp) return -1;
    for (i = 0; i < total; i++) {
        fprintf(fp, "%d|%d|%d|%d\n", lista[i].anime_id, lista[i].estado,
            lista[i].episodio_actual, lista[i].puntuacion);
    }
    fclose(fp);
    return 0;
}

/* ======================== CARRITO ======================== */
int CargarCarrito(int user_id, ItemCarrito *carrito, int max) {
    char ruta[256];
    FILE *fp;
    int total = 0;
    snprintf(ruta, sizeof(ruta), "%s%d.dat", DIR_CARRITOS, user_id);
    fp = fopen(ruta, "r");
    if (!fp) return 0;
    while (total < max && fscanf(fp, "%d|%d\n",
        &carrito[total].anime_id, &carrito[total].cantidad) == 2) {
        total++;
    }
    fclose(fp);
    return total;
}

int GuardarCarrito(int user_id, ItemCarrito *carrito, int total) {
    char ruta[256];
    FILE *fp;
    int i;
    snprintf(ruta, sizeof(ruta), "%s%d.dat", DIR_CARRITOS, user_id);
    fp = fopen(ruta, "w");
    if (!fp) return -1;
    for (i = 0; i < total; i++) {
        fprintf(fp, "%d|%d\n", carrito[i].anime_id, carrito[i].cantidad);
    }
    fclose(fp);
    return 0;
}

/* ======================== VENTAS ======================== */
int RegistrarVenta(const Venta *venta) {
    FILE *fp = fopen(ARCHIVO_VENTAS, "a");
    if (!fp) return -1;
    fprintf(fp, "%d|%d|%.2f|%ld\n", venta->usuario_id, venta->anime_id, venta->monto, (long)venta->fecha);
    fclose(fp);
    return 0;
}

int CargarVentas(Venta *lista, int max) {
    FILE *fp = fopen(ARCHIVO_VENTAS, "r");
    int total = 0;
    if (!fp) return 0;
    while (total < max && fscanf(fp, "%d|%d|%f|%ld\n",
        &lista[total].usuario_id, &lista[total].anime_id,
        &lista[total].monto, (long *)&lista[total].fecha) == 4) {
        total++;
    }
    fclose(fp);
    return total;
}
