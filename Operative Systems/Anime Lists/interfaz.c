/*
 * interfaz.c - Funciones ncurses compartidas entre cliente y admin
 */
#include "interfaz.h"
#include <string.h>
#include <stdlib.h>
#include <wchar.h>
#include <locale.h>

void InitColores(void) {
    start_color();
    use_default_colors();
    set_escdelay(25); /* ESC responde en 25ms en vez de 1000ms */
    init_pair(C_NORMAL, COLOR_WHITE, -1);
    init_pair(C_TITULO, COLOR_CYAN, -1);
    init_pair(C_INPUT,  COLOR_WHITE, COLOR_BLUE);
    init_pair(C_ERROR,  COLOR_RED, -1);
    init_pair(C_EXITO,  COLOR_GREEN, -1);
    init_pair(C_MENU,   COLOR_YELLOW, -1);
    init_pair(C_BORDE,  COLOR_CYAN, -1);
    init_pair(C_HEADER, COLOR_BLACK, COLOR_CYAN);
}

WINDOW *CrearVentanaCentrada(int alto, int ancho) {
    int filas, cols;
    getmaxyx(stdscr, filas, cols);
    WINDOW *w = newwin(alto, ancho, (filas-alto)/2, (cols-ancho)/2);
    keypad(w, TRUE);
    return w;
}

void DibujarMarco(WINDOW *w, const char *titulo) {
    int ancho = getmaxx(w);
    wattron(w, COLOR_PAIR(C_BORDE));
    box(w, 0, 0);
    wattroff(w, COLOR_PAIR(C_BORDE));
    if (titulo) {
        wattron(w, COLOR_PAIR(C_TITULO) | A_BOLD);
        mvwprintw(w, 0, (ancho - (int)strlen(titulo) - 4)/2, "[ %s ]", titulo);
        wattroff(w, COLOR_PAIR(C_TITULO) | A_BOLD);
    }
    /* Mostrar instrucción de ESC en la parte inferior */
    wattron(w, COLOR_PAIR(C_BORDE));
    mvwprintw(w, getmaxy(w)-1, 2, " ESC: Regresar ");
    wattroff(w, COLOR_PAIR(C_BORDE));
}

void MostrarMsg(WINDOW *w, int fila, const char *msg, int color) {
    int ancho = getmaxx(w);
    int col = (ancho - (int)strlen(msg)) / 2;
    if (col < 1) col = 1;
    wattron(w, COLOR_PAIR(color) | A_BOLD);
    mvwprintw(w, fila, col, "%s", msg);
    wattroff(w, COLOR_PAIR(color) | A_BOLD);
    wrefresh(w);
}

void MostrarBanner(WINDOW *w, int fila) {
    int ancho = getmaxx(w);
    const char *lineas[] = {
        "   _    _   _ ___ __  __ _____   ",
        "  /_\\  | \\ | |_ _|  \\/  | ____|  ",
        " / _ \\ |  \\| || || |\\/| |  _|    ",
        "/ ___ \\| |\\  || || |  | | |___   ",
        "/_/ \\_\\_| \\_|___|_|  |_|_____|  ",
        "   GESTOR DE LISTAS DE ANIME     "
    };
    int i;
    wattron(w, COLOR_PAIR(C_TITULO) | A_BOLD);
    for (i = 0; i < 6; i++)
        mvwprintw(w, fila + i, (ancho - 34)/2, "%s", lineas[i]);
    wattroff(w, COLOR_PAIR(C_TITULO) | A_BOLD);
}

/*
 * ObtenerTexto - Lee texto con soporte para ESC (regresar)
 * Retorna: 1 si el usuario escribió algo, 0 si presionó ESC
 */
int ObtenerTexto(WINDOW *w, int fila, int col, char *buf, int max, int oculto) {
    wint_t ch; int pos = 0, ancho_campo = (max < 30) ? max : 30;
    wchar_t wbuf[256] = {0};
    int i;
    wattron(w, COLOR_PAIR(C_INPUT));
    for (i = 0; i < ancho_campo; i++) mvwaddch(w, fila, col+i, ' ');
    wattroff(w, COLOR_PAIR(C_INPUT));
    wmove(w, fila, col);
    wrefresh(w);
    curs_set(1);
    noecho();

    while (1) {
        int res = wget_wch(w, &ch);
        if (ch == 27) { /* ESC */
            curs_set(0);
            buf[0] = '\0';
            return 0;
        }
        if (ch == '\n' || ch== '\r' ||ch == KEY_ENTER) break;
        if ((ch == KEY_BACKSPACE || ch == 127 || ch == 8) || ch=='\b') {
            if(pos>0){
            pos--;
                wbuf[pos] = L'\0';
                buf[pos] = '\0';
                wattron(w, COLOR_PAIR(C_INPUT));
                for (i = 0; i < ancho_campo; i++) mvwaddch(w, fila, col+i, ' ');
                if(oculto){
                    for(i = 0; i<pos;i++) mvwaddch(w, fila, col+i,'*');
                }else{
                    mvwaddnwstr(w,fila,col,wbuf,pos);
                }
                wattroff(w, COLOR_PAIR(C_INPUT));
                wmove(w, fila, col+pos);
            }
        } else if (res==OK && pos < max-1 && ch >= 32) {
            wbuf[pos] = (wchar_t)ch;
            pos++;
            wbuf[pos] = L'\0';
            wattron(w, COLOR_PAIR(C_INPUT));
            for(i=0;i<ancho_campo; i++) mvwaddch(w,fila,col+i,' ');
            if(oculto){
              for (i = 0; i < pos; i++) mvwaddch(w, fila, col+i, '*');
            }
            else{
               mvwaddnwstr(w, fila, col, wbuf, pos);
            }
            wattroff(w, COLOR_PAIR(C_INPUT));
            wmove(w, fila, col+pos);
        }
        wrefresh(w);
    }
    curs_set(0);
    wcstombs(buf, wbuf, max);
    return 1;
}

int MenuSeleccion(WINDOW *w, const char **opciones, int num, int fila_base, const char *titulo) {
    int sel = 0, ch, i;
    keypad(w, TRUE);
    curs_set(0);
    while (1) {
        if (titulo) {
            wattron(w, COLOR_PAIR(C_TITULO) | A_BOLD);
            mvwprintw(w, fila_base - 2, 4, "%s", titulo);
            wattroff(w, COLOR_PAIR(C_TITULO) | A_BOLD);
        }
        for (i = 0; i < num; i++) {
            if (i == sel) {
                wattron(w, COLOR_PAIR(C_MENU) | A_REVERSE | A_BOLD);
            }
            mvwprintw(w, fila_base + i, 6, "  %-30s", opciones[i]);
            wattroff(w, COLOR_PAIR(C_MENU) | A_REVERSE | A_BOLD);
        }
        wattron(w, COLOR_PAIR(C_BORDE));
        mvwprintw(w, fila_base + num + 1, 4, "Flechas + ENTER para seleccionar");
        wattroff(w, COLOR_PAIR(C_BORDE));
        wrefresh(w);

        ch = wgetch(w);
        if (ch == KEY_UP && sel > 0) sel--;
        else if (ch == KEY_DOWN && sel < num-1) sel++;
        else if (ch == '\n' || ch == KEY_ENTER) return sel;
        else if (ch == 27) return -1;/* ESC = regresar */
    }
}
