#include "cliente.h"
#include "admin.h"
MemoriaPrivada *g_mp = NULL;
int g_sem_cli = -1, g_sem_srv = -1;
int g_shmid_global = -1;
MemoriaGlobal *g_global_ref = NULL;
int g_desconectado = 0;
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

int Conectar(void)
{
    g_desconectado = 0;
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
    g_global_ref->rol = SIN_ROL;
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
        g_mp = NULL;
    }
    if (g_global_ref)
    {
        DesvincularMemoria(g_global_ref);
        g_global_ref = NULL;
    }
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

int cliente(WINDOW *w){
    while (1)
    {
        if (!ServidorActivo())
        {
            MostrarDesconexion();
            return -1;
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
            PantallaCatalogo(ROL_CLIENTE);
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
            return 0;
        }
    }
}

int admin(WINDOW *w){
    while (1)
    {
        if (!ServidorActivo())
        {
            MostrarDesconexion();
            return -1;
        }
        const char *op[] = {"Gestionar Animes", "Gestionar Usuarios", "Reportes de Ventas", "Cerrar Sesion"};
        w = CrearVentanaCentrada(20, 50);
        werase(w);
        DibujarMarco(w, "PANEL ADMIN");
        int sel = MenuSeleccion(w, op, 4, 4, NULL);
        delwin(w);
        if (sel == -1)
            continue;
        switch (sel)
        {
        case 0:
            PantallaCatalogo(ROL_ADMIN);
            break;
        case 1:
            PantallaUsuarios();
            break;
        case 2:
            PantallaReportes();
            break;
        case 3:
            Desconectar();
            return 0;
        }
    }
}

int autenticacion(WINDOW *w){
    int autenticado = 0;
    while (!autenticado)
    {
        const char *ol[] = {"Iniciar Sesion", "Registrarse", "Administrador","Salir"};
        w = CrearVentanaCentrada(20, 50);
        werase(w);
        DibujarMarco(w, "ANIME MANAGER");
        MostrarBanner(w, 2);
        int sel = MenuSeleccion(w, ol, 4, 10, NULL);
        delwin(w);
        if (sel == 0)
        {
            int r = PantallaLogin(ROL_CLIENTE);
            if (r == 1) autenticado = 1;
            else if (r == -2) return -1;
        }
        else if (sel == 1){
            int r = PantallaRegistro();
            if (r == -2) return -1;
        }
        else if (sel == 2)
        {
            int r = PantallaLogin(ROL_ADMIN);
            if(r==1) autenticado = 2;
            else if(r==-2) return -1;
        }
        else if (sel == 3 || sel == -1)
        {
            return -2;
        }
    }
    if(autenticado == 1) return ROL_CLIENTE;
    else if(autenticado == 2) return ROL_ADMIN;
    return -1;
}
int autenticado(WINDOW *w){
    if(g_global_ref->rol == ROL_CLIENTE){
        return cliente(w);
    }
    else if(g_global_ref->rol == ROL_ADMIN){
        return admin(w);
    }
    return -1;
}

int main(void)
{
    setlocale(LC_ALL, "");
    initscr();
    cbreak();
    noecho();
    curs_set(0);
    if (has_colors())
        InitColores();
    WINDOW *w = NULL;
    while(1){
        if(g_mp==NULL){
            w=CrearVentanaCentrada(20,50);
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
                w=NULL;
                break;
            }
            MostrarMsg(w, 12, "Conectado!", C_EXITO);
            napms(800);            
        }
        //autenticación
        int rol = autenticacion(w);
        if(rol == -2 || rol == -1){
            break;
        }
        g_global_ref->rol = rol;
        //Ya verificado
        int estado_salida = autenticado(w);
        if(estado_salida == -1){
            break;
        }
    }
    Desconectar();
    if(w!=NULL){
        delwin(w);
    }
    endwin();
    return 0;
}
