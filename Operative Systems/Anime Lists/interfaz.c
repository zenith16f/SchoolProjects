/*
 * interfaz.c - Funciones ncurses compartidas entre cliente y admin
 */
#include "interfaz.h"
#include "cliente.h"
#include "admin.h"

static void TablaAnimes(WINDOW *w, int rol, int inicio);
static void PieDePagina(WINDOW *w, int rol, int inicio);
static int Navegacion(int ch, int *inicio);
static int AccionCliente(WINDOW *w, int ch);
static int AccionAdmin(WINDOW *w, int ch);

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
    wint_t ch; int pos = strlen(buf), ancho_campo = (max < 30) ? max : 30;
    wchar_t wbuf[256] = {0};
    int i;
    if(pos>0){
        mbstowcs(wbuf, buf, max);
    }

    wattron(w, COLOR_PAIR(C_INPUT));
    for (i = 0; i < ancho_campo; i++) mvwaddch(w, fila, col+i, ' ');
    if(pos>0){
        if(oculto){
            for(i=0;i<pos;i++) mvwaddch(w, fila, col+i, '*');
        } else{
            mvwaddnwstr(w, fila, col, wbuf, pos);
        }
    }

    wattroff(w, COLOR_PAIR(C_INPUT));
    wmove(w, fila, col+pos);
    wrefresh(w);
    curs_set(1);
    noecho();

    while (1) {
        int res = wget_wch(w, &ch);
        if (ch == 27) { /* ESC */
            curs_set(0);
            wcstombs(buf, wbuf, max);
            return 27;
        }
        if (ch == '\n' || ch== '\r' ||ch == KEY_ENTER) break;
        if(ch==KEY_UP || ch==KEY_DOWN || ch=='\t'){
            curs_set(0);
            wcstombs(buf, wbuf, max);
            return ch;
        }
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
    return '\n';
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

static void TablaAnimes(WINDOW *w, int rol, int inicio){
    wattron(w, COLOR_PAIR(C_HEADER));
    if(rol == ROL_ADMIN) mvwprintw(w, 2, 2, " %-3s %-20s %-10s %4s %5s %6s %5s %3s", "ID", "Titulo", "Genero", "Eps", "Anio", "Precio", "Stock", "Act");
    else mvwprintw(w, 2, 2, " %-3s %-22s %-10s %4s %5s %6s %5s", "ID", "Titulo", "Genero", "Eps", "Anio", "Precio", "Stock");
    wattroff(w, COLOR_PAIR(C_HEADER));

    for(int i=0; i<C_ANIM && (inicio+i) < g_mp->num_animes; i++){
        Anime *a = &g_mp->animes[inicio + i];
        if(rol == ROL_ADMIN) mvwprintw(w, 3 + i, 2, " %-3d %-20.20s %-10.10s %4d %5d $%5.2f %5d  %s", a->id, a->titulo, a->genero, a->episodios, a->anio, a->precio, a->stock, a->activo ? "Si" : "No");
        else mvwprintw(w, 3 + i, 2, " %-3d %-22.22s %-10.10s %4d %5d $%5.2f %5d", a->id, a->titulo, a->genero, a->episodios, a->anio, a->precio, a->stock);
    }
}
static void PieDePagina(WINDOW *w, int rol, int inicio){
    int mostrados_fin = (inicio + C_ANIM < g_mp->num_animes) ? inicio + C_ANIM : g_mp->num_animes;
    mvwprintw(w,20,2,"Mostrando: %d-%d de %d animes", inicio+1, mostrados_fin, g_mp->num_animes);
    if(rol==ROL_CLIENTE) mvwprintw(w,21,2,"[A] Agregar lista    [C] Agregar Carrito    [Q] Volver");
    else mvwprintw(w,21,2, "[A] Agregar nuevo   [M] Modificar   [E] Eliminar    [Q] Volver");
    mvwprintw(w,22,2,"Navegar: Flechas de direccion");
}
static int Navegacion(int ch, int *inicio){
    if(ch=='q' || ch=='Q' || ch==27) return 1;
    if(ch==KEY_UP && *inicio>0) (*inicio)--;
    else if(ch==KEY_DOWN && (*inicio+C_ANIM)<g_mp->num_animes) (*inicio)++;
    else if(ch==KEY_LEFT){
        *inicio -= C_ANIM;
        if(*inicio<0) *inicio=0;
    }
    else if(ch==KEY_RIGHT){
        *inicio += C_ANIM;
        if(*inicio >= g_mp->num_animes) *inicio = (g_mp->num_animes - C_ANIM > 0) ? g_mp->num_animes - C_ANIM :0;
    }
    return 0;
}

static int AccionCliente(WINDOW *w, int ch){
    if(ch!='a' && ch!='A'&&ch!='c'&&ch!='C') return 0;
    char s[10] = {0};
    mvwprintw(w,22,2, "%-70s", " ");
    mvwprintw(w,22,2,"Ingrese ID para agregar al %s: ", (ch=='a'||ch=='A')? "Lista" : "Carrito");
    wrefresh(w);
    if(!ObtenerTexto(w,22,38,s,10,0)) return 0;

    g_mp->param_int = atoi(s);
    if(!EnviarOp((ch=='a' || ch=='A')?OP_AGREGAR_LISTA:OP_AGREGAR_CARRITO)) return -1;
    mvwprintw(w,22,2,"%-70s", " ");
    MostrarMsg(w,22,g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO:C_ERROR);
    napms(1200);
    return 0;
}
static int AccionAdmin(WINDOW *w, int ch){
    if(ch=='a' || ch=='A'){
        PantallaAgregarAnime();
        return 0;
    }
    if(ch=='m' || ch=='M' || ch=='e' || ch=='E'){
        if(g_mp->num_animes == 0) return 0;
        char s[10] = {0};
        wrefresh(w);
        g_mp->param_int = atoi(s);
        if(ch=='e' || ch=='E'){
            PantallaEliminarAnime();
            napms(500);
        }else{
            PantallaModificarAnime();
        }
    }
    return 0;
}

int PantallaLogin(int rol){
    WINDOW *w = CrearVentanaCentrada(16,50);
    char user[MAX_USER] = {0}, pass[MAX_PASS] = {0};
    int campo_actual = 0, salida = 0;

    const char *titulo = (rol == ROL_ADMIN) ? "ADMIN - LOGIN" : "INICIAR SESION";
    const char *label_user = (rol == ROL_ADMIN) ? "Usuario admin: ": "Usuario: ";
    int op_enviar = (rol == ROL_ADMIN) ? OP_ADMIN_LOGIN : OP_LOGIN;

    keypad(w,TRUE);
    while(1){
        werase(w);
        DibujarMarco(w,titulo);
        wattron(w,COLOR_PAIR(C_NORMAL) | A_BOLD);
        mvwprintw(w, 3, 4, "%s", label_user);
        mvwprintw(w, 6, 4, "Contrasena: ");
        wattroff(w,COLOR_PAIR(C_NORMAL) | A_BOLD);
        mvwprintw(w,4,4,"%s", user);
        for(int i = 0; i<(int)strlen(pass); i++) mvwaddch(w,7,4+i,'*');
        wrefresh(w);

        if(campo_actual == 0) salida = ObtenerTexto(w,4,4, user, MAX_USER, 0);
        else if(campo_actual == 1) salida = ObtenerTexto(w,7,4,pass,MAX_PASS, 1);

        if(salida == 27){
            delwin(w);
            return -1;
        }
        else if(salida == KEY_UP && campo_actual > 0) campo_actual--;
        else if(salida == KEY_DOWN || salida == '\t' || salida == '\n'){
            if(campo_actual < 1) campo_actual++;
            else if(salida == '\n'){
                if(strlen(user) == 0 || strlen(pass) == 0){
                    MostrarMsg(w, 10, "Campos vacios", C_ERROR);
                    wgetch(w);
                    campo_actual = 0;
                    continue;
                }
                strncpy(g_mp->param_str, user, MAX_STR -1);
                strncpy(g_mp->param_str2, pass, MAX_STR -1);
                if(!EnviarOp(op_enviar)){
                    delwin(w);
                    MostrarDesconexion();
                    return -2;
                }
                if(g_mp->respuesta_codigo == RESP_OK){
                    MostrarMsg(w, 10, g_mp->respuesta_msg,C_EXITO);
                    MostrarMsg(w, 12, "Presione una tecla...", C_BORDE);
                    wgetch(w);
                    delwin(w);
                    return 1;
                }else{
                    MostrarMsg(w,10,g_mp->respuesta_msg, C_ERROR);
                    MostrarMsg(w,12,"Presione una tecla para reintentar...", C_BORDE);
                    wgetch(w);
                    pass[0] = '\0'; //Pass incorrecta
                    campo_actual = 1;
                    continue;
                }
            }
        }
    }   
}
void PantallaCatalogo(int rol)
{
   WINDOW *w = CrearVentanaCentrada(24,75);
   int ch, inicio = 0;
   keypad(w, TRUE);
   while(1){
        if(!EnviarOp(OP_VER_CATALOGO)){
            delwin(w);
            MostrarDesconexion();
            return;
        }
        if(inicio >= g_mp->num_animes && g_mp->num_animes>0) inicio=0;
        werase(w);
        DibujarMarco(w,rol==ROL_ADMIN ? "GESTION DE ANIMES":"CATALOGO DE ANIME");
        if(g_mp->num_animes==0){
            MostrarMsg(w,5,"Catalogo vacio", C_ERROR);
            PieDePagina(w,rol,inicio);
        }else{
            TablaAnimes(w,rol,inicio);
            PieDePagina(w,rol,inicio);
        }
        wrefresh(w);
        ch=wgetch(w);
        if(Navegacion(ch,&inicio)==1)break;
        int estado_op = (rol == ROL_CLIENTE) ? AccionCliente(w, ch):AccionAdmin(w,ch);
        if(estado_op==-1) break;
   }
   delwin(w);
}

