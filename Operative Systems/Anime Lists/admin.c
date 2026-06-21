/*
 * admin.c - Prototipo Final - Stock, modificar anime, reportes por período
 */
#include "admin.h"

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
