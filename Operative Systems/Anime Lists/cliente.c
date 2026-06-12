/*
 * cliente.c - Prototipo Final - Todas las mejoras implementadas
 */
#include "comunes.h"
#include "semaforo.h"
#include "memoria.h"
#include "interfaz.h"
#include "cifrado.h"
#include <locale.h>
#include <stdlib.h>

static MemoriaPrivada *g_mp = NULL;
static int g_sem_cli = -1, g_sem_srv = -1;
static int g_shmid_global = -1;
static MemoriaGlobal *g_global_ref = NULL;
static int g_desconectado = 0;

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
    DibujarMarco(w, "ERROR DE CONEXION");
    MostrarMsg(w, 3, "Se ha perdido la conexion", C_ERROR);
    MostrarMsg(w, 4, "con el servidor.", C_ERROR);
    MostrarMsg(w, 6, "Presione una tecla para salir...", C_BORDE);
    wrefresh(w);
    wgetch(w);
    delwin(w);
}

/* ======================== VALIDACIÓN CONTRASEÑA ======================== */
void MostrarReqsPass(WINDOW *w, int fila, const char *pass)
{
    int mayus = 0, minus = 0, num = 0, simb = 0, len = (int)strlen(pass), i, ancho = getmaxx(w);
    for (i = 0; i < len; i++)
    {
        if (isupper((unsigned char)pass[i]))
            mayus = 1;
        if (islower((unsigned char)pass[i]))
            minus = 1;
        if (isdigit((unsigned char)pass[i]))
            num = 1;
        if (strchr("!@#$%^&*()-_=+[]{}|;:,.<>?/~`", pass[i]))
            simb = 1;
    }
    for (i = 0; i < 5; i++)
    {
        wmove(w, fila + i, 4);
        wclrtoeol(w);
        mvwaddch(w, fila + i, ancho - 1, ACS_VLINE);
    }
    wattron(w, COLOR_PAIR(len >= 6 ? C_EXITO : C_ERROR));
    mvwprintw(w, fila, 4, "%s Min. 6 caracteres", len >= 6 ? "[OK]" : "[  ]");
    wattroff(w, COLOR_PAIR(len >= 6 ? C_EXITO : C_ERROR));
    wattron(w, COLOR_PAIR(mayus ? C_EXITO : C_ERROR));
    mvwprintw(w, fila + 1, 4, "%s Una mayuscula", mayus ? "[OK]" : "[  ]");
    wattroff(w, COLOR_PAIR(mayus ? C_EXITO : C_ERROR));
    wattron(w, COLOR_PAIR(minus ? C_EXITO : C_ERROR));
    mvwprintw(w, fila + 2, 4, "%s Una minuscula", minus ? "[OK]" : "[  ]");
    wattroff(w, COLOR_PAIR(minus ? C_EXITO : C_ERROR));
    wattron(w, COLOR_PAIR(num ? C_EXITO : C_ERROR));
    mvwprintw(w, fila + 3, 4, "%s Un numero", num ? "[OK]" : "[  ]");
    wattroff(w, COLOR_PAIR(num ? C_EXITO : C_ERROR));
    wattron(w, COLOR_PAIR(simb ? C_EXITO : C_ERROR));
    mvwprintw(w, fila + 4, 4, "%s Un simbolo (!@#$...)", simb ? "[OK]" : "[  ]");
    wattroff(w, COLOR_PAIR(simb ? C_EXITO : C_ERROR));
    wrefresh(w);
}
int ValidarPassFuerte(const char *p)
{
    int ma = 0, mi = 0, nu = 0, si = 0, i, l = (int)strlen(p);
    if (l < 6)
        return 0;
    for (i = 0; i < l; i++)
    {
        if (isupper((unsigned char)p[i]))
            ma = 1;
        if (islower((unsigned char)p[i]))
            mi = 1;
        if (isdigit((unsigned char)p[i]))
            nu = 1;
        if (strchr("!@#$%^&*()-_=+[]{}|;:,.<>?/~`", p[i]))
            si = 1;
    }
    return ma && mi && nu && si;
}

int ObtenerPassConReqs(WINDOW *w, int fi, int col, char *buf, int max, int fr) {
    wint_t ch;
    wchar_t wbuf[256] = {0};
    int pos = 0, ac = (max < 30) ? max : 30, i;

    buf[0] = '\0';
    wattron(w, COLOR_PAIR(C_INPUT));
    for (i = 0; i < ac; i++) mvwaddch(w, fi, col + i, ' ');
    wattroff(w, COLOR_PAIR(C_INPUT));
    MostrarReqsPass(w, fr, "");
    wmove(w, fi, col);
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
        if (ch == '\n' || ch == '\r' || ch == KEY_ENTER) break;

        if (ch == KEY_BACKSPACE || ch == 127 || ch == 8 || ch == '\b') {
            if (pos > 0) {
                pos--;
                wbuf[pos] = L'\0';

                wattron(w, COLOR_PAIR(C_INPUT));
                for (i = 0; i < ac; i++) mvwaddch(w, fi, col + i, ' '); 
                for (i = 0; i < pos; i++) mvwaddch(w, fi, col + i, '*');
                wattroff(w, COLOR_PAIR(C_INPUT));
                wcstombs(buf, wbuf, max);
                MostrarReqsPass(w, fr, buf);
                wmove(w, fi, col + pos);
            }
        } 
        else if (res == OK && pos < max - 1 && ch >= 32) {
            wbuf[pos] = (wchar_t)ch;
            pos++;
            wbuf[pos] = L'\0';

            wattron(w, COLOR_PAIR(C_INPUT));
            for (i = 0; i < ac; i++) mvwaddch(w, fi, col + i, ' '); 
            for (i = 0; i < pos; i++) mvwaddch(w, fi, col + i, '*');
            wattroff(w, COLOR_PAIR(C_INPUT));
            wcstombs(buf, wbuf, max);
            MostrarReqsPass(w, fr, buf);
            wmove(w, fi, col + pos);
        }
        wrefresh(w);
    }
    curs_set(0);
    wcstombs(buf, wbuf, max);
    return 1;
}

/* ======================== PANTALLAS ======================== */
int PantallaLogin(void)
{
    WINDOW *w = CrearVentanaCentrada(16, 50);
    char user[MAX_USER] = {0}, pass[MAX_PASS] = {0};
    werase(w);
    DibujarMarco(w, "INICIAR SESION");
    wattron(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    mvwprintw(w, 3, 4, "Usuario:");
    mvwprintw(w, 6, 4, "Contrasena:");
    wattroff(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
    wrefresh(w);
    if (!ObtenerTexto(w, 4, 4, user, MAX_USER, 0))
    {
        delwin(w);
        return -1;
    }
    if (!ObtenerTexto(w, 7, 4, pass, MAX_PASS, 1))
    {
        delwin(w);
        return -1;
    }
    if (strlen(user) == 0 || strlen(pass) == 0)
    {
        MostrarMsg(w, 10, "Campos vacios", C_ERROR);
        MostrarMsg(w, 12, "Presione una tecla...", C_BORDE);
        wgetch(w);
        delwin(w);
        return 0;
    }
    strncpy(g_mp->param_str, user, MAX_STR - 1);
    strncpy(g_mp->param_str2, pass, MAX_STR - 1);
    if (!EnviarOp(OP_LOGIN))
    {
        delwin(w);
        MostrarDesconexion();
        return -2;
    }
    MostrarMsg(w, 10, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
    MostrarMsg(w, 12, "Presione una tecla...", C_BORDE);
    wgetch(w);
    delwin(w);
    return g_mp->respuesta_codigo == RESP_OK ? 1 : 0;
}

int PantallaRegistro(void)
{
    int registrado = 0;
    while (!registrado)
    {
        WINDOW *w = CrearVentanaCentrada(24, 55);
        char user[MAX_USER] = {0}, pass[MAX_PASS] = {0}, pass2[MAX_PASS] = {0}, email[MAX_EMAIL] = {0}, nombre[MAX_NOMBRE] = {0};
        werase(w);
        DibujarMarco(w, "REGISTRO DE USUARIO");
        wattron(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
        mvwprintw(w, 2, 4, "Usuario:");
        mvwprintw(w, 4, 4, "Nombre completo:");
        mvwprintw(w, 6, 4, "Email:");
        mvwprintw(w, 8, 4, "Contrasena:");
        wattroff(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
        wattron(w, COLOR_PAIR(C_BORDE));
        mvwprintw(w, 10, 4, "Requisitos de contrasena:");
        wattroff(w, COLOR_PAIR(C_BORDE));
        wrefresh(w);
        if (!ObtenerTexto(w, 2, 22, user, MAX_USER, 0))
        {
            delwin(w);
            return -1;
        }
        if (strlen(user) < 3)
        {
            MostrarMsg(w, 22, "Usuario muy corto (min 3)", C_ERROR);
            MostrarMsg(w, 24, "Tecla para reintentar...", C_BORDE);
            wgetch(w);
            delwin(w);
            continue;
        }
        if (!ObtenerTexto(w, 4, 22, nombre, MAX_NOMBRE, 0))
        {
            delwin(w);
            return -1;
        }
        if (strlen(nombre) < 2)
        {
            MostrarMsg(w, 22, "Nombre muy corto", C_ERROR);
            MostrarMsg(w, 24, "Tecla para reintentar...", C_BORDE);
            wgetch(w);
            delwin(w);
            continue;
        }
        if (!ObtenerTexto(w, 6, 22, email, MAX_EMAIL, 0))
        {
            delwin(w);
            return -1;
        }
        if (!strchr(email, '@') || !strchr(email, '.'))
        {
            MostrarMsg(w, 22, "Email invalido (requiere @ y dominio)", C_ERROR);
            MostrarMsg(w, 24, "Tecla para reintentar...", C_BORDE);
            wgetch(w);
            delwin(w);
            continue;
        }
        if (!ObtenerPassConReqs(w, 8, 22, pass, MAX_PASS, 11))
        {
            delwin(w);
            return -1;
        }
        if (!ValidarPassFuerte(pass))
        {
            MostrarMsg(w, 22, "Contrasena no cumple requisitos", C_ERROR);
            MostrarMsg(w, 24, "Tecla para reintentar...", C_BORDE);
            wgetch(w);
            delwin(w);
            continue;
        }
        wattron(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
        mvwprintw(w, 17, 4, "Confirmar:");
        wattroff(w, COLOR_PAIR(C_NORMAL) | A_BOLD);
        wrefresh(w);
        if (!ObtenerTexto(w, 17, 22, pass2, MAX_PASS, 1))
        {
            delwin(w);
            return -1;
        }
        if (strcmp(pass, pass2) != 0)
        {
            MostrarMsg(w, 22, "Las contrasenas no coinciden", C_ERROR);
            MostrarMsg(w, 24, "Tecla para reintentar...", C_BORDE);
            wgetch(w);
            delwin(w);
            continue;
        }
        strncpy(g_mp->param_str, user, MAX_STR - 1);
        strncpy(g_mp->param_str2, pass, MAX_STR - 1);
        strncpy(g_mp->param_str3, email, MAX_STR - 1);
        strncpy(g_mp->param_str4, nombre, MAX_NOMBRE - 1);
        if (!EnviarOp(OP_REGISTRO))
        {
            delwin(w);
            MostrarDesconexion();
            return -2;
        }
        if (g_mp->respuesta_codigo == RESP_OK)
        {
            MostrarMsg(w, 22, g_mp->respuesta_msg, C_EXITO);
            registrado = 1;
        }
        else
        {
            MostrarMsg(w, 22, g_mp->respuesta_msg, C_ERROR);
            MostrarMsg(w, 24, "Tecla para reintentar...", C_BORDE);
            wgetch(w);
            delwin(w);
            continue;
        }
        MostrarMsg(w, 24, "Presione una tecla...", C_BORDE);
        wgetch(w);
        delwin(w);
    }
    return 0;
}

void PantallaCatalogo(void)
{
    WINDOW *w = CrearVentanaCentrada(24, 75);
    int i, ch;
    if (!EnviarOp(OP_VER_CATALOGO))
    {
        delwin(w);
        MostrarDesconexion();
        return;
    }
    werase(w);
    DibujarMarco(w, "CATALOGO DE ANIME");
    if (g_mp->num_animes == 0)
    {
        MostrarMsg(w, 5, "Catalogo vacio", C_ERROR);
    }
    else
    {
        wattron(w, COLOR_PAIR(C_HEADER));
        mvwprintw(w, 2, 2, " %-3s %-22s %-10s %4s %5s %6s %5s", "ID", "Titulo", "Genero", "Eps", "Anio", "Precio", "Stock");
        wattroff(w, COLOR_PAIR(C_HEADER));
        for (i = 0; i < g_mp->num_animes && i < 17; i++)
        {
            Anime *a = &g_mp->animes[i];
            mvwprintw(w, 3 + i, 2, " %-3d %-22.22s %-10.10s %4d %5d $%5.2f %5d", a->id, a->titulo, a->genero, a->episodios, a->anio, a->precio, a->stock);
        }
    }
    mvwprintw(w, 21, 2, "[A]Agregar lista [C]Agregar carrito [Q]Volver");
    wrefresh(w);
    while ((ch = wgetch(w)) != 'q' && ch != 'Q')
    {
        if (ch == 'a' || ch == 'A')
        {
            char s[10] = {0};
            mvwprintw(w, 22, 2, "ID: ");
            if (!ObtenerTexto(w, 22, 6, s, 10, 0))
                continue;
            g_mp->param_int = atoi(s);
            if (!EnviarOp(OP_AGREGAR_LISTA))
            {
                MostrarDesconexion();
                break;
            }
            mvwprintw(w, 22, 2, "%-70s", " ");
            MostrarMsg(w, 22, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
            napms(1200);
        }
        else if (ch == 'c' || ch == 'C')
        {
            char s[10] = {0};
            mvwprintw(w, 22, 2, "ID: ");
            if (!ObtenerTexto(w, 22, 6, s, 10, 0))
                continue;
            g_mp->param_int = atoi(s);
            if (!EnviarOp(OP_AGREGAR_CARRITO))
            {
                MostrarDesconexion();
                break;
            }
            mvwprintw(w, 22, 2, "%-70s", " ");
            MostrarMsg(w, 22, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
            napms(1200);
        }
    }
    delwin(w);
}

void PantallaLista(void)
{
    WINDOW *w = CrearVentanaCentrada(22, 72);
    int i, ch;
    const char *est[] = {"Plan", "Viendo", "Completo", "Pausado", "Dropped"};
    if (!EnviarOp(OP_VER_LISTA))
    {
        delwin(w);
        MostrarDesconexion();
        return;
    }
    werase(w);
    DibujarMarco(w, "MI LISTA DE ANIME");
    if (g_mp->num_lista == 0)
    {
        MostrarMsg(w, 5, "Lista vacia", C_MENU);
    }
    else
    {
        wattron(w, COLOR_PAIR(C_HEADER));
        mvwprintw(w, 2, 2, " %-3s %-24s %-10s %4s %5s", "ID", "Titulo", "Estado", "Ep", "Punt");
        wattroff(w, COLOR_PAIR(C_HEADER));
        for (i = 0; i < g_mp->num_lista && i < 15; i++)
        {
            ItemLista *it = &g_mp->lista[i];
            char t[MAX_STR] = "?";
            int j;
            for (j = 0; j < g_mp->num_animes; j++)
                if (g_mp->animes[j].id == it->anime_id)
                {
                    strncpy(t, g_mp->animes[j].titulo, MAX_STR - 1);
                    break;
                }
            mvwprintw(w, 3 + i, 2, " %-3d %-24.24s %-10s %4d %5d", it->anime_id, t, est[it->estado], it->episodio_actual, it->puntuacion);
        }
    }
    mvwprintw(w, 19, 2, "[E]Editar [D]Eliminar [Q]Volver");
    wrefresh(w);
    while ((ch = wgetch(w)) != 'q' && ch != 'Q')
    {
        if (ch == 'd' || ch == 'D')
        {
            char s[10] = {0};
            mvwprintw(w, 20, 2, "ID eliminar: ");
            if (!ObtenerTexto(w, 20, 16, s, 10, 0))
                continue;
            g_mp->param_int = atoi(s);
            if (!EnviarOp(OP_ELIMINAR_LISTA))
            {
                MostrarDesconexion();
                break;
            }
            MostrarMsg(w, 20, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
            napms(1200);
        }
        else if (ch == 'e' || ch == 'E')
        {
            char sid[10] = {0}, sest[10] = {0}, sep[10] = {0}, spun[10] = {0};
            mvwprintw(w, 20, 2, "ID editar: ");
            if (!ObtenerTexto(w, 20, 14, sid, 10, 0))
                continue;
            mvwprintw(w, 20, 26, "Estado(0-4): ");
            if (!ObtenerTexto(w, 20, 40, sest, 10, 0))
                continue;
            mvwprintw(w, 20, 44, "Ep: ");
            if (!ObtenerTexto(w, 20, 49, sep, 10, 0))
                continue;
            mvwprintw(w, 20, 54, "Punt(1-10): ");
            if (!ObtenerTexto(w, 20, 66, spun, 10, 0))
                continue;
            g_mp->param_int = atoi(sid);
            g_mp->param_int2 = atoi(sest);
            g_mp->param_int3 = atoi(sep);
            g_mp->param_float = (float)atoi(spun);
            if (!EnviarOp(OP_EDITAR_LISTA))
            {
                MostrarDesconexion();
                break;
            }
            mvwprintw(w, 20, 2, "%-68s", " ");
            MostrarMsg(w, 20, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
            napms(1200);
        }
    }
    delwin(w);
}

void PantallaCarrito(void)
{
    WINDOW *w = CrearVentanaCentrada(18, 62);
    int i, ch;
    if (!EnviarOp(OP_VER_CARRITO))
    {
        delwin(w);
        MostrarDesconexion();
        return;
    }
    werase(w);
    DibujarMarco(w, "CARRITO DE COMPRAS");
    if (g_mp->num_carrito == 0)
    {
        MostrarMsg(w, 5, "Carrito vacio", C_MENU);
    }
    else
    {
        wattron(w, COLOR_PAIR(C_HEADER));
        mvwprintw(w, 2, 2, " %-3s %-28s %4s %7s", "ID", "Titulo", "Cant", "Precio");
        wattroff(w, COLOR_PAIR(C_HEADER));
        float total = 0;
        for (i = 0; i < g_mp->num_carrito && i < 10; i++)
        {
            ItemCarrito *ic = &g_mp->carrito[i];
            char t[MAX_STR] = "?";
            float p = 0;
            int j;
            for (j = 0; j < g_mp->num_animes; j++)
                if (g_mp->animes[j].id == ic->anime_id)
                {
                    strncpy(t, g_mp->animes[j].titulo, MAX_STR - 1);
                    p = g_mp->animes[j].precio;
                    break;
                }
            float sub = p * ic->cantidad;
            total += sub;
            mvwprintw(w, 3 + i, 2, " %-3d %-28.28s %4d $%6.2f", ic->anime_id, t, ic->cantidad, sub);
        }
        wattron(w, A_BOLD);
        mvwprintw(w, 14, 2, "TOTAL: $%.2f", total);
        wattroff(w, A_BOLD);
    }
    mvwprintw(w, 15, 2, "[C]Comprar todo [Q]Volver");
    wrefresh(w);
    while ((ch = wgetch(w)) != 'q' && ch != 'Q')
    {
        if (ch == 'c' || ch == 'C')
        {
            if (!EnviarOp(OP_COMPRAR))
            {
                MostrarDesconexion();
                break;
            }
            MostrarMsg(w, 16, g_mp->respuesta_msg, C_EXITO);
            napms(1500);
            break;
        }
    }
    delwin(w);
}

void PantallaPerfil(void)
{
    WINDOW *w = CrearVentanaCentrada(20, 55);
    int ch;
    if (!EnviarOp(OP_VER_PERFIL))
    {
        delwin(w);
        MostrarDesconexion();
        return;
    }
    werase(w);
    DibujarMarco(w, "MI PERFIL");
    mvwprintw(w, 3, 4, "ID:       %d", g_mp->usuario_resp.id);
    mvwprintw(w, 4, 4, "Usuario:  %s", g_mp->usuario_resp.usuario);
    mvwprintw(w, 5, 4, "Nombre:   %s", g_mp->usuario_resp.nombre);
    mvwprintw(w, 6, 4, "Email:    %s", g_mp->usuario_resp.email);
    mvwprintw(w, 9, 4, "[M]Modificar perfil  [Q]Volver");
    wrefresh(w);
    while ((ch = wgetch(w)) != 'q' && ch != 'Q')
    {
        if (ch == 'm' || ch == 'M')
        {
            char nn[MAX_NOMBRE] = {0}, ne[MAX_EMAIL] = {0};
            mvwprintw(w, 11, 4, "Nuevo nombre (vacio=no cambiar):");
            if (!ObtenerTexto(w, 11, 36, nn, MAX_NOMBRE, 0))
                continue;
            mvwprintw(w, 12, 4, "Nuevo email  (vacio=no cambiar):");
            if (!ObtenerTexto(w, 12, 36, ne, MAX_EMAIL, 0))
                continue;
            if (strlen(ne)>0 && (!strchr(ne, '@') || !strchr(ne, '.')))
            {
                MostrarMsg(w, 16, "Email invalido (requiere @ y dominio)", C_ERROR);
                MostrarMsg(w, 18, "Tecla Q para volver...", C_BORDE);
                wrefresh(w);
                continue;
            }
            strncpy(g_mp->param_str, nn, MAX_STR - 1);
            strncpy(g_mp->param_str2, ne, MAX_STR - 1);
            if (!EnviarOp(OP_MODIFICAR_PERFIL))
            {
                MostrarDesconexion();
                break;
            }
            MostrarMsg(w, 14, g_mp->respuesta_msg, g_mp->respuesta_codigo == RESP_OK ? C_EXITO : C_ERROR);
            napms(1200);
        }
    }
    delwin(w);
}

/* ======================== CONEXIÓN ======================== */
int Conectar(void)
{
    key_t llave_shm = ftok(ARCHIVO_SHM, ID_SHM_GLOBAL);
    key_t llave_mutex = ftok(ARCHIVO_SEM, ID_SEM_MUTEX);
    key_t llave_srv = ftok(ARCHIVO_SEM, ID_SEM_SERVIDOR);
    key_t llave_cli = ftok(ARCHIVO_SEM, ID_SEM_CLIENTE);
    if (llave_shm == -1 || llave_mutex == -1 || llave_srv == -1 || llave_cli == -1)
        return 0;
    g_shmid_global = ObtenerMemoriaCompartida(llave_shm, sizeof(MemoriaGlobal));
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
    int sem_mutex = ObtenerSemaforo(llave_mutex);
    int sem_srv = ObtenerSemaforo(llave_srv);
    int sem_cli_resp = ObtenerSemaforo(llave_cli);
    SemaforoDown(sem_mutex);
    g_global_ref->cliente_pid = getpid();
    g_global_ref->solicitud_conexion = 1;
    g_global_ref->rol = ROL_CLIENTE;
    SemaforoUp(sem_mutex);
    SemaforoUp(sem_srv);
    SemaforoDown(sem_cli_resp);
    SemaforoDown(sem_mutex);
    int shmid_priv = g_global_ref->shmid_privado;
    g_sem_cli = g_global_ref->sem_cli_listo;
    g_sem_srv = g_global_ref->sem_srv_listo;
    SemaforoUp(sem_mutex);
    g_mp = (MemoriaPrivada *)AdjuntarMemoria(shmid_priv);
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

/* ======================== MAIN ======================== */
int main(void)
{
    setlocale(LC_ALL, "");
    initscr();
    cbreak();
    noecho();
    curs_set(0);
    if (has_colors())
        InitColores();
    WINDOW *w = CrearVentanaCentrada(20, 50);
    werase(w);
    DibujarMarco(w, NULL);
    MostrarBanner(w, 2);
    MostrarMsg(w, 10, "Conectando al servidor...", C_MENU);
    wrefresh(w);
    if (!Conectar())
    {
        MostrarMsg(w, 12, "ERROR: El servidor no esta activo", C_ERROR);
        MostrarMsg(w, 14, "Presione una tecla para salir...", C_BORDE);
        wgetch(w);
        delwin(w);
        endwin();
        return 1;
    }
    MostrarMsg(w, 12, "Conectado!", C_EXITO);
    napms(800);
    delwin(w);
    int autenticado = 0;
    while (!autenticado)
    {
        const char *ol[] = {"Iniciar Sesion", "Registrarse", "Salir"};
        w = CrearVentanaCentrada(18, 50);
        werase(w);
        DibujarMarco(w, "ANIME MANAGER");
        MostrarBanner(w, 2);
        int sel = MenuSeleccion(w, ol, 3, 10, NULL);
        delwin(w);
        if (sel == 0)
        {
            int r = PantallaLogin();
            if (r == 1)
                autenticado = 1;
            else if (r == -2)
            {
                Desconectar();
                endwin();
                return 1;
            }
        }
        else if (sel == 1)
        {
            int r = PantallaRegistro();
            if (r == -2)
            {
                Desconectar();
                endwin();
                return 1;
            }
        }
        else if (sel == 2 || sel == -1)
        {
            Desconectar();
            endwin();
            return 0;
        }
    }
    while (1)
    {
        if (!ServidorActivo())
        {
            MostrarDesconexion();
            break;
        }
        const char *op[] = {"Ver Catalogo", "Mi Lista", "Carrito de Compras", "Mi Perfil", "Cerrar Sesion"};
        w = CrearVentanaCentrada(18, 50);
        werase(w);
        DibujarMarco(w, "PANEL PRINCIPAL");
        wattron(w, COLOR_PAIR(C_EXITO));
        mvwprintw(w, 2, 4, "Bienvenido, %s", g_mp->usuario_nombre);
        wattroff(w, COLOR_PAIR(C_EXITO));
        int sel = MenuSeleccion(w, op, 5, 5, NULL);
        delwin(w);
        if (sel == -1)
            continue;
        switch (sel)
        {
        case 0:
            PantallaCatalogo();
            break;
        case 1:
            PantallaLista();
            break;
        case 2:
            PantallaCarrito();
            break;
        case 3:
            PantallaPerfil();
            break;
        case 4:
            Desconectar();
            endwin();
            return 0;
        }
    }
    Desconectar();
    endwin();
    return 0;
}
