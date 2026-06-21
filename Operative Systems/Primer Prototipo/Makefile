# Makefile - Gestor de Listas de Anime
# Proyecto - Sistemas Operativos - ESCOM IPN - Grupo 4CV4

CC      = gcc
CFLAGS  = -Wall -Wextra -pedantic -std=c99
LDFLAGS = -lpthread -lncurses

COMUNES = semaforo.o memoria.o archivo.o cifrado.o

.PHONY: all clean

all: servidor cliente admin

servidor: servidor.o $(COMUNES)
	$(CC) $(CFLAGS) -o $@ $^ -lpthread

cliente: cliente.o $(COMUNES) interfaz.o
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

admin: admin.o $(COMUNES) interfaz.o
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

servidor.o: servidor.c comunes.h semaforo.h memoria.h archivo.h cifrado.h
	$(CC) $(CFLAGS) -c $< -o $@

cliente.o: cliente.c comunes.h semaforo.h memoria.h interfaz.h cifrado.h
	$(CC) $(CFLAGS) -c $< -o $@

admin.o: admin.c comunes.h semaforo.h memoria.h interfaz.h
	$(CC) $(CFLAGS) -c $< -o $@

semaforo.o: semaforo.c comunes.h
	$(CC) $(CFLAGS) -c $< -o $@

memoria.o: memoria.c comunes.h
	$(CC) $(CFLAGS) -c $< -o $@

archivo.o: archivo.c archivo.h comunes.h
	$(CC) $(CFLAGS) -c $< -o $@

cifrado.o: cifrado.c comunes.h
	$(CC) $(CFLAGS) -c $< -o $@

interfaz.o: interfaz.c interfaz.h
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f *.o servidor cliente admin ipc_shm ipc_sem
	rm -rf datos/
