/*
 * admin.c - Administrador del gestor de listas de anime con ncurses
 */
#include "comunes.h"
#include "semaforo.h"
#include "memoria.h"
#include "interfaz.h"

static MemoriaPrivada *g_mp = NULL;
static int g_sem_cli = -1, g_sem_srv = -1;

void EnviarOp(int op) {
    g_mp->operacion = op;
    SemaforoUp(g_sem_cli);
    SemaforoDown(g_sem_srv);
}

int PantallaLoginAdmin(void) {
    WINDOW *w = CrearVentanaCentrada(14, 50);
    char user[MAX_USER]={0}, pass[MAX_PASS]={0};
    werase(w); DibujarMarco(w, "ADMIN - LOGIN");
    wattron(w, COLOR_PAIR(C_NORMAL)|A_BOLD);
    mvwprintw(w, 3, 4, "Usuario admin:");
    mvwprintw(w, 5, 4, "Contrasena:");
    wattroff(w, COLOR_PAIR(C_NORMAL)|A_BOLD);
    wrefresh(w);
    ObtenerTexto(w, 3, 20, user, MAX_USER, 0);
    ObtenerTexto(w, 5, 20, pass, MAX_PASS, 1);
    strncpy(g_mp->param_str, user, MAX_STR-1);
    strncpy(g_mp->param_str2, pass, MAX_STR-1);
    EnviarOp(OP_ADMIN_LOGIN);
    MostrarMsg(w, 8, g_mp->respuesta_msg, g_mp->respuesta_codigo==RESP_OK ? C_EXITO : C_ERROR);
    MostrarMsg(w, 10, "Presione una tecla...", C_BORDE);
    wgetch(w); delwin(w);
    return g_mp->respuesta_codigo == RESP_OK;
}

void PantallaVerCatalogo(void) {
    WINDOW *w = CrearVentanaCentrada(22, 70);
    int i;
    EnviarOp(OP_VER_CATALOGO);
    werase(w); DibujarMarco(w, "CATALOGO ACTUAL");
    wattron(w, COLOR_PAIR(C_HEADER));
    mvwprintw(w, 2, 2, " %-4s %-22s %-10s %4s %5s %7s %3s", "ID","Titulo","Genero","Eps","Anio","Precio","Act");
    wattroff(w, COLOR_PAIR(C_HEADER));
    for (i = 0; i < g_mp->num_animes && i < 16; i++) {
        Anime *a = &g_mp->animes[i];
        mvwprintw(w, 3+i, 2, " %-4d %-22.22s %-10.10s %4d %5d $%6.2f  %s",
            a->id, a->titulo, a->genero, a->episodios, a->anio, a->precio, a->activo?"Si":"No");
    }
    MostrarMsg(w, 20, "Presione una tecla...", C_BORDE);
    wrefresh(w); wgetch(w); delwin(w);
}

void PantallaAgregarAnime(void) {
    WINDOW *w = CrearVentanaCentrada(18, 55);
    char titulo[MAX_STR]={0}, genero[MAX_STR]={0}, eps[10]={0}, anio[10]={0}, precio[10]={0};
    werase(w); DibujarMarco(w, "AGREGAR ANIME");
    wattron(w, COLOR_PAIR(C_NORMAL)|A_BOLD);
    mvwprintw(w, 2, 4, "Titulo:");     mvwprintw(w, 4, 4, "Genero:");
    mvwprintw(w, 6, 4, "Episodios:");  mvwprintw(w, 8, 4, "Anio:");
    mvwprintw(w, 10, 4, "Precio:");
    wattroff(w, COLOR_PAIR(C_NORMAL)|A_BOLD);
    wrefresh(w);
    ObtenerTexto(w, 2, 16, titulo, MAX_STR, 0);
    ObtenerTexto(w, 4, 16, genero, MAX_STR, 0);
    ObtenerTexto(w, 6, 16, eps, 10, 0);
    ObtenerTexto(w, 8, 16, anio, 10, 0);
    ObtenerTexto(w, 10, 16, precio, 10, 0);

    if (strlen(titulo)==0 || strlen(genero)==0 || atoi(eps)<=0 || atoi(anio)<=0) {
        MostrarMsg(w, 13, "Campos invalidos", C_ERROR);
    } else {
        strncpy(g_mp->param_str, titulo, MAX_STR-1);
        strncpy(g_mp->param_str2, genero, MAX_STR-1);
        g_mp->param_int = atoi(eps);
        g_mp->param_int2 = atoi(anio);
        g_mp->param_float = atof(precio);
        EnviarOp(OP_ADMIN_ADD_ANIME);
        MostrarMsg(w, 13, g_mp->respuesta_msg, C_EXITO);
    }
    MostrarMsg(w, 15, "Presione una tecla...", C_BORDE);
    wgetch(w); delwin(w);
}

void PantallaEliminarAnime(void) {
    WINDOW *w = CrearVentanaCentrada(10, 50);
    char id_str[10]={0};
    werase(w); DibujarMarco(w, "ELIMINAR ANIME");
    mvwprintw(w, 3, 4, "ID del anime a eliminar:");
    wrefresh(w);
    ObtenerTexto(w, 3, 30, id_str, 10, 0);
    g_mp->param_int = atoi(id_str);
    EnviarOp(OP_ADMIN_DEL_ANIME);
    MostrarMsg(w, 5, g_mp->respuesta_msg, g_mp->respuesta_codigo==RESP_OK ? C_EXITO : C_ERROR);
    MostrarMsg(w, 7, "Presione una tecla...", C_BORDE);
    wgetch(w); delwin(w);
}

void PantallaUsuarios(void) {
    WINDOW *w = CrearVentanaCentrada(18, 60);
    int ch;
    EnviarOp(OP_ADMIN_VER_USERS);
    werase(w); DibujarMarco(w, "USUARIOS REGISTRADOS");
    wattron(w, COLOR_PAIR(C_HEADER));
    mvwprintw(w, 2, 2, " %-4s %-15s %-20s %-15s", "ID","Usuario","Email","Nombre");
    wattroff(w, COLOR_PAIR(C_HEADER));
    /* Parsear la respuesta */
    char *linea = strtok(g_mp->respuesta_msg, "\n");
    int fila = 3;
    while (linea && fila < 14) {
        int id; char usr[32],email[64],nombre[128];
        if (sscanf(linea, "%d|%31[^|]|%63[^|]|%127s", &id, usr, email, nombre) >= 3)
            mvwprintw(w, fila++, 2, " %-4d %-15s %-20s %-15s", id, usr, email, nombre);
        linea = strtok(NULL, "\n");
    }
    mvwprintw(w, 15, 2, "[D] Eliminar usuario  [Q] Volver");
    wrefresh(w);
    while ((ch = wgetch(w)) != 'q' && ch != 'Q') {
        if (ch == 'd' || ch == 'D') {
            char id_str[10]={0};
            mvwprintw(w, 16, 2, "ID: ");
            ObtenerTexto(w, 16, 6, id_str, 10, 0);
            g_mp->param_int = atoi(id_str);
            EnviarOp(OP_ADMIN_DEL_USER);
            MostrarMsg(w, 16, g_mp->respuesta_msg, C_EXITO);
            napms(1000);
        }
    }
    delwin(w);
}

void PantallaReportes(void) {
    WINDOW *w = CrearVentanaCentrada(12, 50);
    EnviarOp(OP_ADMIN_REPORTE);
    werase(w); DibujarMarco(w, "REPORTE DE VENTAS");
    wattron(w, COLOR_PAIR(C_NORMAL));
    mvwprintw(w, 3, 4, "Total de ventas: %d", g_mp->param_int);
    mvwprintw(w, 4, 4, "Monto total:     $%.2f", g_mp->param_float);
    wattroff(w, COLOR_PAIR(C_NORMAL));
    MostrarMsg(w, 8, "Presione una tecla...", C_BORDE);
    wrefresh(w); wgetch(w); delwin(w);
}

int Conectar(void) {
    key_t llave_shm = ftok(ARCHIVO_SHM, ID_SHM_GLOBAL);
    key_t llave_mutex = ftok(ARCHIVO_SEM, ID_SEM_MUTEX);
    key_t llave_srv = ftok(ARCHIVO_SEM, ID_SEM_SERVIDOR);
    key_t llave_cli = ftok(ARCHIVO_SEM, ID_SEM_CLIENTE);
    if (llave_shm==-1||llave_mutex==-1||llave_srv==-1||llave_cli==-1) return 0;
    int shmid = ObtenerMemoriaCompartida(llave_shm, sizeof(MemoriaGlobal));
    if (shmid == -1) return 0;
    MemoriaGlobal *global = (MemoriaGlobal *)AdjuntarMemoria(shmid);
    if (!global || !global->servidor_activo) { if(global) DesvincularMemoria(global); return 0; }
    int sem_mutex = ObtenerSemaforo(llave_mutex);
    int sem_srv = ObtenerSemaforo(llave_srv);
    int sem_cli_resp = ObtenerSemaforo(llave_cli);

    SemaforoDown(sem_mutex);
    global->cliente_pid = getpid();
    global->solicitud_conexion = 1;
    global->rol = ROL_ADMIN;
    SemaforoUp(sem_mutex);
    SemaforoUp(sem_srv);
    SemaforoDown(sem_cli_resp);

    SemaforoDown(sem_mutex);
    key_t llave_priv = global->llave_privada;
    g_sem_cli = global->sem_cli_listo;
    g_sem_srv = global->sem_srv_listo;
    SemaforoUp(sem_mutex);

    int shmid_priv = ObtenerMemoriaCompartida(llave_priv, sizeof(MemoriaPrivada));
    g_mp = (MemoriaPrivada *)AdjuntarMemoria(shmid_priv);
    g_mp->cliente_pid = getpid();
    DesvincularMemoria(global);
    return 1;
}

void Desconectar(void) {
    if (g_mp) { g_mp->operacion = OP_DESCONECTAR; SemaforoUp(g_sem_cli); DesvincularMemoria(g_mp); }
}

int main(void) {
    initscr(); cbreak(); noecho(); curs_set(0); keypad(stdscr, TRUE);
    if (has_colors()) InitColores();

    WINDOW *w = CrearVentanaCentrada(14, 50);
    werase(w); DibujarMarco(w, "ADMIN - ANIME MANAGER");
    MostrarMsg(w, 4, "Conectando al servidor...", C_MENU);
    wrefresh(w);

    if (!Conectar()) {
        MostrarMsg(w, 6, "ERROR: El servidor no esta activo", C_ERROR);
        MostrarMsg(w, 8, "Presione una tecla...", C_BORDE);
        wgetch(w); delwin(w); endwin();
        return 1;
    }
    MostrarMsg(w, 6, "Conectado!", C_EXITO);
    napms(800); delwin(w);

    if (!PantallaLoginAdmin()) {
        Desconectar(); endwin(); return 1;
    }

    while (1) {
        const char *opts[] = {"Ver Catalogo", "Agregar Anime", "Eliminar Anime",
            "Gestionar Usuarios", "Reporte de Ventas", "Cerrar Sesion"};
        w = CrearVentanaCentrada(18, 50);
        werase(w); DibujarMarco(w, "PANEL DE ADMINISTRACION");
        int sel = MenuSeleccion(w, opts, 6, 4, NULL);
        delwin(w);

        switch (sel) {
            case 0: PantallaVerCatalogo(); break;
            case 1: PantallaAgregarAnime(); break;
            case 2: PantallaEliminarAnime(); break;
            case 3: PantallaUsuarios(); break;
            case 4: PantallaReportes(); break;
            case 5: Desconectar(); endwin(); return 0;
        }
    }
}
