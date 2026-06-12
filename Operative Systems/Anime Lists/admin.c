/*
 * admin.c - Prototipo Final - Stock, modificar anime, reportes por período
 */
#include "comunes.h"
#include "semaforo.h"
#include "memoria.h"
#include "interfaz.h"
#include <locale.h>

static MemoriaPrivada *g_mp = NULL;
static int g_sem_cli = -1, g_sem_srv = -1, g_shmid_global = -1, g_desconectado = 0;
static MemoriaGlobal *g_global_ref = NULL;

int ServidorActivo(void)
{
    if (g_desconectado)
        return 0;
    if (g_global_ref && !g_global_ref->servidor_activo)
    {
        g_desconectado = 1;
        return 0;
    }
    struct shmid_ds buf;
    if (g_shmid_global != -1 && shmctl(g_shmid_global, IPC_STAT, &buf) == -1)
    {
        g_desconectado = 1;
        return 0;
    }
    return 1;
}
int EnviarOp(int op)
{
    if (!ServidorActivo())
        return 0;
    g_mp->operacion = op;
    SemaforoUp(g_sem_cli);
    struct sembuf sop = {0, -1, 0};
    struct timespec ts = {5, 0};
    if (semtimedop(g_sem_srv, &sop, 1, &ts) == -1)
    {
        g_desconectado = 1;
        return 0;
    }
    return 1;
}
void MostrarDesconexion(void)
{
    WINDOW *w = CrearVentanaCentrada(8, 50);
    werase(w);
    DibujarMarco(w, "ERROR");
    MostrarMsg(w, 3, "Conexion perdida con el servidor", C_ERROR);
    MostrarMsg(w, 5, "Presione una tecla...", C_BORDE);
    wrefresh(w);
    wgetch(w);
    delwin(w);
}

int PantallaLoginAdmin(void)
{
    WINDOW *w = CrearVentanaCentrada(14, 50);
    char u[MAX_USER] = {0}, p[MAX_PASS] = {0};
    werase(w);
    DibujarMarco(w, "ADMIN - LOGIN");
    wattron(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    mvwprintw(w, 3, 4, "Usuario admin:");
    mvwprintw(w, 5, 4, "Contrasena:");
    wattroff(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    wrefresh(w);
    if (!ObtenerTexto(w, 3, 20, u, MAX_USER, 0))
    {
        delwin(w);
        return -1;
    }
    if (!ObtenerTexto(w, 5, 20, p, MAX_PASS, 1))
    {
        delwin(w);
        return -1;
    }
    strncpy(g_mp->param_str, u, MAX_STR - 1);
    strncpy(g_mp->param_str2, p, MAX_STR - 1);
    if (!EnviarOp(OP_ADMIN_LOGIN))
    {
        delwin(w);
        MostrarDesconexion();
        return -2;
    }
    MostrarMsg(w, 8, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
    MostrarMsg(w, 10, "Presione una tecla...", C_BORDE);
    wgetch(w);
    delwin(w);
    return g_mp->respuesta_codigo == RESP_OK ? 1 : 0;
}

void PantallaVerCatalogo(void)
{
    WINDOW *w = CrearVentanaCentrada(24, 75);
    int i;
    if (!EnviarOp(OP_VER_CATALOGO))
    {
        delwin(w);
        MostrarDesconexion();
        return;
    }
    werase(w);
    DibujarMarco(w, "CATALOGO");
    wattron(w, COLOR_PAIR(C_HEADER));
    mvwprintw(w, 2, 2, " %-3s %-20s %-10s %4s %5s %6s %5s %3s", "ID", "Titulo", "Genero", "Eps", "Anio", "Precio", "Stock", "Act");
    wattroff(w, COLOR_PAIR(C_HEADER));
    for (i = 0; i < g_mp->num_animes && i < 18; i++)
    {
        Anime *a = &g_mp->animes[i];
        mvwprintw(w, 3 + i, 2, " %-3d %-20.20s %-10.10s %4d %5d $%5.2f %5d  %s", a->id, a->titulo, a->genero, a->episodios, a->anio, a->precio, a->stock, a->activo ? "Si" : "No");
    }
    MostrarMsg(w, 22, "Presione una tecla...", C_BORDE);
    wrefresh(w);
    wgetch(w);
    delwin(w);
}

void PantallaAgregarAnime(void)
{
    WINDOW *w = CrearVentanaCentrada(20, 55);
    char tit[MAX_STR] = {0}, gen[MAX_STR] = {0}, eps[10] = {0}, anio[10] = {0}, precio[10] = {0}, stock[10] = {0};
    werase(w);
    DibujarMarco(w, "AGREGAR ANIME");
    wattron(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    mvwprintw(w, 2, 4, "Titulo:");
    mvwprintw(w, 4, 4, "Genero:");
    mvwprintw(w, 6, 4, "Episodios:");
    mvwprintw(w, 8, 4, "Anio:");
    mvwprintw(w, 10, 4, "Precio:");
    mvwprintw(w, 12, 4, "Stock:");
    wattroff(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    wrefresh(w);
    if (!ObtenerTexto(w, 2, 16, tit, MAX_STR, 0))
    {
        delwin(w);
        return;
    }
    if (!ObtenerTexto(w, 4, 16, gen, MAX_STR, 0))
    {
        delwin(w);
        return;
    }
    if (!ObtenerTexto(w, 6, 16, eps, 10, 0))
    {
        delwin(w);
        return;
    }
    if (!ObtenerTexto(w, 8, 16, anio, 10, 0))
    {
        delwin(w);
        return;
    }
    if (!ObtenerTexto(w, 10, 16, precio, 10, 0))
    {
        delwin(w);
        return;
    }
    if (!ObtenerTexto(w, 12, 16, stock, 10, 0))
    {
        delwin(w);
        return;
    }
    if (strlen(tit) == 0 || strlen(gen) == 0 || atoi(eps) <= 0 || atoi(anio) <= 0 || atoi(stock) < 0)
    {
        MostrarMsg(w, 15, "Campos invalidos", C_ERROR);
    }
    else
    {
        strncpy(g_mp->param_str, tit, MAX_STR - 1);
        strncpy(g_mp->param_str2, gen, MAX_STR - 1);
        g_mp->param_int = atoi(eps);
        g_mp->param_int2 = atoi(anio);
        g_mp->param_float = atof(precio);
        g_mp->param_int3 = atoi(stock);
        if (!EnviarOp(OP_ADMIN_ADD_ANIME))
        {
            delwin(w);
            MostrarDesconexion();
            return;
        }
        MostrarMsg(w, 15, g_mp->respuesta_msg, C_EXITO);
    }
    MostrarMsg(w, 17, "Presione una tecla...", C_BORDE);
    wgetch(w);
    delwin(w);
}

void PantallaEliminarAnime(void)
{
    WINDOW *w = CrearVentanaCentrada(10, 50);
    char s[10] = {0};
    werase(w);
    DibujarMarco(w, "ELIMINAR ANIME");
    mvwprintw(w, 3, 4, "ID del anime:");
    wrefresh(w);
    if (!ObtenerTexto(w, 3, 20, s, 10, 0))
    {
        delwin(w);
        return;
    }
    g_mp->param_int = atoi(s);
    if (!EnviarOp(OP_ADMIN_DEL_ANIME))
    {
        delwin(w);
        MostrarDesconexion();
        return;
    }
    MostrarMsg(w, 5, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
    MostrarMsg(w, 7, "Presione una tecla...", C_BORDE);
    wgetch(w);
    delwin(w);
}

void PantallaModificarAnime(void)
{
    WINDOW *w = CrearVentanaCentrada(18, 55);
    char sid[10] = {0}, tit[MAX_STR] = {0}, gen[MAX_STR] = {0}, eps[10] = {0}, precio[10] = {0}, stock[10] = {0};
    werase(w);
    DibujarMarco(w, "MODIFICAR ANIME");
    wattron(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    mvwprintw(w, 2, 4, "ID del anime:");
    wattroff(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    wrefresh(w);
    if (!ObtenerTexto(w, 2, 20, sid, 10, 0))
    {
        delwin(w);
        return;
    }
    wattron(w, COLOR_PAIR(C_BORDE));
    mvwprintw(w, 4, 4, "(Dejar vacio = no cambiar)");
    wattroff(w, COLOR_PAIR(C_BORDE));
    wattron(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    mvwprintw(w, 5, 4, "Titulo:");
    mvwprintw(w, 7, 4, "Genero:");
    mvwprintw(w, 9, 4, "Episodios:");
    mvwprintw(w, 11, 4, "Precio:");
    mvwprintw(w, 13, 4, "Stock:");
    wattroff(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    wrefresh(w);
    if (!ObtenerTexto(w, 5, 16, tit, MAX_STR, 0))
    {
        delwin(w);
        return;
    }
    if (!ObtenerTexto(w, 7, 16, gen, MAX_STR, 0))
    {
        delwin(w);
        return;
    }
    if (!ObtenerTexto(w, 9, 16, eps, 10, 0))
    {
        delwin(w);
        return;
    }
    if (!ObtenerTexto(w, 11, 16, precio, 10, 0))
    {
        delwin(w);
        return;
    }
    if (!ObtenerTexto(w, 13, 16, stock, 10, 0))
    {
        delwin(w);
        return;
    }
    g_mp->param_int = atoi(sid);
    strncpy(g_mp->param_str, tit, MAX_STR - 1);
    strncpy(g_mp->param_str2, gen, MAX_STR - 1);
    g_mp->param_int2 = atoi(eps);
    g_mp->param_float = atof(precio);
    g_mp->param_int3 = strlen(stock) > 0 ? atoi(stock) : -1;
    if (!EnviarOp(OP_ADMIN_MOD_ANIME))
    {
        delwin(w);
        MostrarDesconexion();
        return;
    }
    MostrarMsg(w, 15, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
    MostrarMsg(w, 16, "Presione una tecla...", C_BORDE);
    wgetch(w);
    delwin(w);
}

void PantallaUsuarios(void)
{
    WINDOW *w = CrearVentanaCentrada(18, 60);
    int ch;
    if (!EnviarOp(OP_ADMIN_VER_USERS))
    {
        delwin(w);
        MostrarDesconexion();
        return;
    }
    werase(w);
    DibujarMarco(w, "USUARIOS");
    wattron(w, COLOR_PAIR(C_HEADER));
    mvwprintw(w, 2, 2, " %-3s %-12s %-20s %-15s", "ID", "Usuario", "Email", "Nombre");
    wattroff(w, COLOR_PAIR(C_HEADER));
    char copia[MAX_FRASE];
    strncpy(copia, g_mp->respuesta_msg, MAX_FRASE - 1);
    char *linea = strtok(copia, "\n");
    int fila = 3;
    while (linea && fila < 14)
    {
        int id;
        char us[32], em[64], nm[128];
        if (sscanf(linea, "%d|%31[^|]|%63[^|]|%127s", &id, us, em, nm) >= 3)
            mvwprintw(w, fila++, 2, " %-3d %-12s %-20s %-15s", id, us, em, nm);
        linea = strtok(NULL, "\n");
    }
    mvwprintw(w, 15, 2, "[D]Eliminar usuario [Q]Volver");
    wrefresh(w);
    while ((ch = wgetch(w)) != 'q' && ch != 'Q' && ch != 27)
    {
        if (ch == 'd' || ch == 'D')
        {
            char s[10] = {0};
            mvwprintw(w, 16, 2, "ID: ");
            if (!ObtenerTexto(w, 16, 6, s, 10, 0))
                continue;
            g_mp->param_int = atoi(s);
            if (!EnviarOp(OP_ADMIN_DEL_USER))
            {
                MostrarDesconexion();
                break;
            }
            MostrarMsg(w, 16, g_mp->respuesta_msg, C_EXITO);
            napms(1000);
        }
    }
    delwin(w);
}

void PantallaReportes(void)
{
    WINDOW *w = CrearVentanaCentrada(16, 50);
    werase(w);
    DibujarMarco(w, "REPORTES DE VENTAS");
    const char *op[] = {"Reporte Total", "Reporte Diario", "Reporte Semanal", "Reporte Mensual", "Volver"};
    int sel = MenuSeleccion(w, op, 5, 3, NULL);
    delwin(w);
    if (sel == -1 || sel == 4)
        return;
    int ops[] = {OP_ADMIN_REPORTE, OP_ADMIN_REPORTE_D, OP_ADMIN_REPORTE_S, OP_ADMIN_REPORTE_M};
    w = CrearVentanaCentrada(10, 50);
    if (!EnviarOp(ops[sel]))
    {
        delwin(w);
        MostrarDesconexion();
        return;
    }
    werase(w);
    DibujarMarco(w, "REPORTE");
    mvwprintw(w, 3, 4, "%s", g_mp->respuesta_msg);
    mvwprintw(w, 4, 4, "Items vendidos: %d", g_mp->param_int);
    mvwprintw(w, 5, 4, "Monto total:    $%.2f", g_mp->param_float);
    MostrarMsg(w, 7, "Presione una tecla...", C_BORDE);
    wrefresh(w);
    wgetch(w);
    delwin(w);
}

int Conectar(void)
{
    key_t lk = ftok(ARCHIVO_SHM, ID_SHM_GLOBAL), lm = ftok(ARCHIVO_SEM, ID_SEM_MUTEX), ls = ftok(ARCHIVO_SEM, ID_SEM_SERVIDOR), lc = ftok(ARCHIVO_SEM, ID_SEM_CLIENTE);
    if (lk == -1 || lm == -1 || ls == -1 || lc == -1)
        return 0;
    g_shmid_global = ObtenerMemoriaCompartida(lk, sizeof(MemoriaGlobal));
    if (g_shmid_global == -1)
        return 0;
    g_global_ref = (MemoriaGlobal *)AdjuntarMemoria(g_shmid_global);
    if (!g_global_ref || !g_global_ref->servidor_activo)
    {
        if (g_global_ref)
            DesvincularMemoria(g_global_ref);
        g_global_ref = NULL;
        return 0;
    }
    int sm = ObtenerSemaforo(lm), ss = ObtenerSemaforo(ls), sc = ObtenerSemaforo(lc);
    SemaforoDown(sm);
    g_global_ref->cliente_pid = getpid();
    g_global_ref->solicitud_conexion = 1;
    g_global_ref->rol = ROL_ADMIN;
    SemaforoUp(sm);
    SemaforoUp(ss);
    SemaforoDown(sc);
    SemaforoDown(sm);
    int sp = g_global_ref->shmid_privado;
    g_sem_cli = g_global_ref->sem_cli_listo;
    g_sem_srv = g_global_ref->sem_srv_listo;
    SemaforoUp(sm);
    g_mp = (MemoriaPrivada *)AdjuntarMemoria(sp);
    g_mp->cliente_pid = getpid();
    return 1;
}
void Desconectar(void)
{
    if (g_mp && !g_desconectado)
    {
        g_mp->operacion = OP_DESCONECTAR;
        SemaforoUp(g_sem_cli);
        DesvincularMemoria(g_mp);
    }
    if (g_global_ref)
    {
        DesvincularMemoria(g_global_ref);
        g_global_ref = NULL;
    }
}

int main(void)
{
    setlocale(LC_ALL, "");
    initscr();
    cbreak();
    noecho();
    curs_set(0);
    keypad(stdscr, TRUE);
    if (has_colors())
        InitColores();
    WINDOW *w = CrearVentanaCentrada(14, 50);
    werase(w);
    DibujarMarco(w, "ADMIN - ANIME MANAGER");
    MostrarMsg(w, 4, "Conectando al servidor...", C_MENU);
    wrefresh(w);
    if (!Conectar())
    {
        MostrarMsg(w, 6, "ERROR: Servidor no activo", C_ERROR);
        MostrarMsg(w, 8, "Presione una tecla...", C_BORDE);
        wgetch(w);
        delwin(w);
        endwin();
        return 1;
    }
    MostrarMsg(w, 6, "Conectado!", C_EXITO);
    napms(800);
    delwin(w);
    int logueado = 0;
    while (!logueado)
    {
        int r = PantallaLoginAdmin();
        if (r == 1)
            logueado = 1;
        else if (r == -1 || r == -2)
        {
            Desconectar();
            endwin();
            return 1;
        }
    }
    while (1)
    {
        if (!ServidorActivo())
        {
            MostrarDesconexion();
            break;
        }
        const char *op[] = {"Ver Catalogo", "Agregar Anime", "Eliminar Anime", "Modificar Anime", "Gestionar Usuarios", "Reportes de Ventas", "Cerrar Sesion"};
        w = CrearVentanaCentrada(20, 50);
        werase(w);
        DibujarMarco(w, "PANEL ADMIN");
        int sel = MenuSeleccion(w, op, 7, 4, NULL);
        delwin(w);
        if (sel == -1)
            continue;
        switch (sel)
        {
        case 0:
            PantallaVerCatalogo();
            break;
        case 1:
            PantallaAgregarAnime();
            break;
        case 2:
            PantallaEliminarAnime();
            break;
        case 3:
            PantallaModificarAnime();
            break;
        case 4:
            PantallaUsuarios();
            break;
        case 5:
            PantallaReportes();
            break;
        case 6:
            Desconectar();
            endwin();
            return 0;
        }
    }
    Desconectar();
    endwin();
    return 0;
}
