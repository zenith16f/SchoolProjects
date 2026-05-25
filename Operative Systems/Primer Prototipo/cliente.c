/*
 * cliente.c - Cliente del gestor de listas de anime con ncurses
 */
#include "comunes.h"
#include "semaforo.h"
#include "memoria.h"
#include "interfaz.h"
#include "cifrado.h"

static MemoriaPrivada *g_mp = NULL;
static int g_sem_cli = -1, g_sem_srv = -1;

/* Envía operación y espera respuesta */
void EnviarOp(int op) {
    g_mp->operacion = op;
    SemaforoUp(g_sem_cli);
    SemaforoDown(g_sem_srv);
}

/* ======================== PANTALLAS ======================== */
int PantallaLogin(void) {
    WINDOW *w = CrearVentanaCentrada(16, 50);
    char user[MAX_USER] = {0}, pass[MAX_PASS] = {0};

    werase(w); DibujarMarco(w, "INICIAR SESION");
    wattron(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    mvwprintw(w, 3, 4, "Usuario:");
    mvwprintw(w, 6, 4, "Contrasena:");
    wattroff(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    wrefresh(w);

    ObtenerTexto(w, 4, 4, user, MAX_USER, 0);
    ObtenerTexto(w, 7, 4, pass, MAX_PASS, 1);

    strncpy(g_mp->param_str, user, MAX_STR-1);
    strncpy(g_mp->param_str2, pass, MAX_STR-1);
    EnviarOp(OP_LOGIN);

    if (g_mp->respuesta_codigo == RESP_OK) {
        MostrarMsg(w, 10, g_mp->respuesta_msg, C_EXITO);
    } else {
        MostrarMsg(w, 10, g_mp->respuesta_msg, C_ERROR);
    }
    MostrarMsg(w, 12, "Presione una tecla...", C_BORDE);
    wgetch(w); delwin(w);
    return g_mp->respuesta_codigo == RESP_OK;
}

void PantallaRegistro(void) {
    WINDOW *w = CrearVentanaCentrada(18, 50);
    char user[MAX_USER]={0}, pass[MAX_PASS]={0}, pass2[MAX_PASS]={0}, email[MAX_EMAIL]={0};

    werase(w); DibujarMarco(w, "REGISTRO");
    wattron(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    mvwprintw(w, 2, 4, "Usuario:"); mvwprintw(w, 4, 4, "Email:");
    mvwprintw(w, 6, 4, "Contrasena:"); mvwprintw(w, 8, 4, "Confirmar:");
    wattroff(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    wrefresh(w);

    ObtenerTexto(w, 2, 16, user, MAX_USER, 0);
    ObtenerTexto(w, 4, 16, email, MAX_EMAIL, 0);
    ObtenerTexto(w, 6, 16, pass, MAX_PASS, 1);
    ObtenerTexto(w, 8, 16, pass2, MAX_PASS, 1);

    if (strlen(user) < 3) { MostrarMsg(w, 11, "Usuario muy corto (min 3)", C_ERROR); }
    else if (strlen(pass) < 4) { MostrarMsg(w, 11, "Contrasena muy corta (min 4)", C_ERROR); }
    else if (strcmp(pass, pass2) != 0) { MostrarMsg(w, 11, "Las contrasenas no coinciden", C_ERROR); }
    else if (!strchr(email, '@')) { MostrarMsg(w, 11, "Email invalido (requiere @)", C_ERROR); }
    else {
        strncpy(g_mp->param_str, user, MAX_STR-1);
        strncpy(g_mp->param_str2, pass, MAX_STR-1);
        strncpy(g_mp->param_str3, email, MAX_STR-1);
        EnviarOp(OP_REGISTRO);
        MostrarMsg(w, 11, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
    }
    MostrarMsg(w, 13, "Presione una tecla...", C_BORDE);
    wgetch(w); delwin(w);
}

void PantallaCatalogo(void) {
    WINDOW *w = CrearVentanaCentrada(22, 70);
    int i, ch;

    EnviarOp(OP_VER_CATALOGO);
    werase(w); DibujarMarco(w, "CATALOGO DE ANIME");

    if (g_mp->num_animes == 0) {
        MostrarMsg(w, 5, "No hay animes en el catalogo", C_ERROR);
    } else {
        wattron(w, COLOR_PAIR(C_HEADER));
        mvwprintw(w, 2, 2, " %-4s %-25s %-12s %4s %5s %7s ", "ID", "Titulo", "Genero", "Eps", "Anio", "Precio");
        wattroff(w, COLOR_PAIR(C_HEADER));
        for (i = 0; i < g_mp->num_animes && i < 16; i++) {
            Anime *a = &g_mp->animes[i];
            mvwprintw(w, 3+i, 2, " %-4d %-25.25s %-12.12s %4d %5d $%6.2f",
                a->id, a->titulo, a->genero, a->episodios, a->anio, a->precio);
        }
    }

    mvwprintw(w, 19, 2, "[A] Agregar a lista  [C] Agregar a carrito  [Q] Volver");
    wrefresh(w);

    while ((ch = wgetch(w)) != 'q' && ch != 'Q') {
        if (ch == 'a' || ch == 'A') {
            char id_str[10] = {0};
            mvwprintw(w, 20, 2, "ID del anime: ");
            ObtenerTexto(w, 20, 16, id_str, 10, 0);
            g_mp->param_int = atoi(id_str);
            EnviarOp(OP_AGREGAR_LISTA);
            MostrarMsg(w, 20, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
            napms(1000);
        } else if (ch == 'c' || ch == 'C') {
            char id_str[10] = {0};
            mvwprintw(w, 20, 2, "ID del anime: ");
            ObtenerTexto(w, 20, 16, id_str, 10, 0);
            g_mp->param_int = atoi(id_str);
            EnviarOp(OP_AGREGAR_CARRITO);
            MostrarMsg(w, 20, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
            napms(1000);
        }
    }
    delwin(w);
}

void PantallaLista(void) {
    WINDOW *w = CrearVentanaCentrada(20, 70);
    int i, ch;
    const char *estados[] = {"Plan", "Viendo", "Completo", "Pausado", "Dropped"};

    EnviarOp(OP_VER_LISTA);
    werase(w); DibujarMarco(w, "MI LISTA DE ANIME");

    if (g_mp->num_lista == 0) {
        MostrarMsg(w, 5, "Tu lista esta vacia", C_MENU);
    } else {
        wattron(w, COLOR_PAIR(C_HEADER));
        mvwprintw(w, 2, 2, " %-4s %-28s %-10s %4s %5s ", "ID", "Titulo", "Estado", "Ep", "Punt");
        wattroff(w, COLOR_PAIR(C_HEADER));
        for (i = 0; i < g_mp->num_lista && i < 14; i++) {
            ItemLista *it = &g_mp->lista[i];
            /* Buscar título en el catálogo cargado */
            char titulo[MAX_STR] = "Desconocido";
            int j;
            for (j = 0; j < g_mp->num_animes; j++) {
                if (g_mp->animes[j].id == it->anime_id) {
                    strncpy(titulo, g_mp->animes[j].titulo, MAX_STR-1);
                    break;
                }
            }
            mvwprintw(w, 3+i, 2, " %-4d %-28.28s %-10s %4d %5d",
                it->anime_id, titulo, estados[it->estado], it->episodio_actual, it->puntuacion);
        }
    }

    mvwprintw(w, 17, 2, "[D] Eliminar de lista  [Q] Volver");
    wrefresh(w);

    while ((ch = wgetch(w)) != 'q' && ch != 'Q') {
        if (ch == 'd' || ch == 'D') {
            char id_str[10] = {0};
            mvwprintw(w, 18, 2, "ID a eliminar: ");
            ObtenerTexto(w, 18, 18, id_str, 10, 0);
            g_mp->param_int = atoi(id_str);
            EnviarOp(OP_ELIMINAR_LISTA);
            MostrarMsg(w, 18, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
            napms(1000);
        }
    }
    delwin(w);
}

void PantallaCarrito(void) {
    WINDOW *w = CrearVentanaCentrada(18, 60);
    int i, ch;

    EnviarOp(OP_VER_CARRITO);
    werase(w); DibujarMarco(w, "CARRITO DE COMPRAS");

    if (g_mp->num_carrito == 0) {
        MostrarMsg(w, 5, "Tu carrito esta vacio", C_MENU);
    } else {
        wattron(w, COLOR_PAIR(C_HEADER));
        mvwprintw(w, 2, 2, " %-4s %-30s %4s %7s ", "ID", "Titulo", "Cant", "Precio");
        wattroff(w, COLOR_PAIR(C_HEADER));
        float total = 0;
        for (i = 0; i < g_mp->num_carrito && i < 10; i++) {
            ItemCarrito *ic = &g_mp->carrito[i];
            char titulo[MAX_STR] = "?";
            float precio = 0;
            int j;
            for (j = 0; j < g_mp->num_animes; j++) {
                if (g_mp->animes[j].id == ic->anime_id) {
                    strncpy(titulo, g_mp->animes[j].titulo, MAX_STR-1);
                    precio = g_mp->animes[j].precio;
                    break;
                }
            }
            float subtotal = precio * ic->cantidad;
            total += subtotal;
            mvwprintw(w, 3+i, 2, " %-4d %-30.30s %4d $%6.2f", ic->anime_id, titulo, ic->cantidad, subtotal);
        }
        wattron(w, A_BOLD);
        mvwprintw(w, 14, 2, "TOTAL: $%.2f", total);
        wattroff(w, A_BOLD);
    }

    mvwprintw(w, 15, 2, "[C] Comprar todo  [Q] Volver");
    wrefresh(w);

    while ((ch = wgetch(w)) != 'q' && ch != 'Q') {
        if (ch == 'c' || ch == 'C') {
            EnviarOp(OP_COMPRAR);
            MostrarMsg(w, 16, g_mp->respuesta_msg, C_EXITO);
            napms(1500);
            break;
        }
    }
    delwin(w);
}

void PantallaPerfil(void) {
    WINDOW *w = CrearVentanaCentrada(14, 50);
    EnviarOp(OP_VER_PERFIL);
    werase(w); DibujarMarco(w, "MI PERFIL");

    wattron(w, COLOR_PAIR(C_NORMAL));
    mvwprintw(w, 3, 4, "ID:       %d", g_mp->usuario_resp.id);
    mvwprintw(w, 4, 4, "Usuario:  %s", g_mp->usuario_resp.usuario);
    mvwprintw(w, 5, 4, "Nombre:   %s", g_mp->usuario_resp.nombre);
    mvwprintw(w, 6, 4, "Email:    %s", g_mp->usuario_resp.email);
    wattroff(w, COLOR_PAIR(C_NORMAL));

    MostrarMsg(w, 10, "Presione una tecla para volver...", C_BORDE);
    wrefresh(w);
    wgetch(w); delwin(w);
}

/* ======================== CONEXIÓN AL SERVIDOR ======================== */
int Conectar(void) {
    key_t llave_shm = ftok(ARCHIVO_SHM, ID_SHM_GLOBAL);
    key_t llave_mutex = ftok(ARCHIVO_SEM, ID_SEM_MUTEX);
    key_t llave_srv = ftok(ARCHIVO_SEM, ID_SEM_SERVIDOR);
    key_t llave_cli = ftok(ARCHIVO_SEM, ID_SEM_CLIENTE);

    if (llave_shm == -1 || llave_mutex == -1 || llave_srv == -1 || llave_cli == -1) return 0;

    int shmid = ObtenerMemoriaCompartida(llave_shm, sizeof(MemoriaGlobal));
    if (shmid == -1) return 0;

    MemoriaGlobal *global = (MemoriaGlobal *)AdjuntarMemoria(shmid);
    if (!global || !global->servidor_activo) {
        if (global) DesvincularMemoria(global);
        return 0;
    }

    int sem_mutex = ObtenerSemaforo(llave_mutex);
    int sem_srv = ObtenerSemaforo(llave_srv);
    int sem_cli_resp = ObtenerSemaforo(llave_cli);

    /* Solicitar conexión */
    SemaforoDown(sem_mutex);
    global->cliente_pid = getpid();
    global->solicitud_conexion = 1;
    global->rol = ROL_CLIENTE;
    SemaforoUp(sem_mutex);

    /* Señalar al servidor */
    SemaforoUp(sem_srv);

    /* Esperar que el servidor asigne memoria privada */
    SemaforoDown(sem_cli_resp);

    /* Leer la información de la memoria privada */
    SemaforoDown(sem_mutex);
    key_t llave_priv = global->llave_privada;
    g_sem_cli = global->sem_cli_listo;
    g_sem_srv = global->sem_srv_listo;
    SemaforoUp(sem_mutex);

    /* Adjuntar memoria privada */
    int shmid_priv = ObtenerMemoriaCompartida(llave_priv, sizeof(MemoriaPrivada));
    g_mp = (MemoriaPrivada *)AdjuntarMemoria(shmid_priv);
    g_mp->cliente_pid = getpid();

    DesvincularMemoria(global);
    return 1;
}

void Desconectar(void) {
    if (g_mp) {
        g_mp->operacion = OP_DESCONECTAR;
        SemaforoUp(g_sem_cli);
        DesvincularMemoria(g_mp);
    }
}

/* ======================== MAIN ======================== */
int main(void) {
    initscr(); cbreak(); noecho(); curs_set(0); keypad(stdscr, TRUE);
    if (has_colors()) InitColores();

    WINDOW *w = CrearVentanaCentrada(20, 50);
    werase(w); DibujarMarco(w, NULL);
    MostrarBanner(w, 2);
    MostrarMsg(w, 10, "Conectando al servidor...", C_MENU);
    wrefresh(w);

    if (!Conectar()) {
        MostrarMsg(w, 12, "ERROR: El servidor no esta activo", C_ERROR);
        MostrarMsg(w, 14, "Presione una tecla para salir...", C_BORDE);
        wgetch(w); delwin(w); endwin();
        return 1;
    }

    MostrarMsg(w, 12, "Conectado!", C_EXITO);
    napms(800);
    delwin(w);

    /* Menú de login/registro */
    int autenticado = 0;
    while (!autenticado) {
        const char *opts_login[] = {"Iniciar Sesion", "Registrarse", "Salir"};
        w = CrearVentanaCentrada(18, 50);
        werase(w); DibujarMarco(w, "ANIME MANAGER");
        MostrarBanner(w, 2);
        int sel = MenuSeleccion(w, opts_login, 3, 10, NULL);
        delwin(w);

        if (sel == 0) autenticado = PantallaLogin();
        else if (sel == 1) PantallaRegistro();
        else { Desconectar(); endwin(); return 0; }
    }

    /* Menú principal */
    while (1) {
        const char *opts[] = {"Ver Catalogo", "Mi Lista", "Carrito de Compras", "Mi Perfil", "Cerrar Sesion"};
        w = CrearVentanaCentrada(18, 50);
        werase(w); DibujarMarco(w, "PANEL PRINCIPAL");
        wattron(w, COLOR_PAIR(C_EXITO));
        mvwprintw(w, 2, 4, "Bienvenido, %s", g_mp->usuario_nombre);
        wattroff(w, COLOR_PAIR(C_EXITO));
        int sel = MenuSeleccion(w, opts, 5, 5, NULL);
        delwin(w);

        switch (sel) {
            case 0: PantallaCatalogo(); break;
            case 1: PantallaLista(); break;
            case 2: PantallaCarrito(); break;
            case 3: PantallaPerfil(); break;
            case 4: Desconectar(); endwin(); return 0;
        }
    }
}
