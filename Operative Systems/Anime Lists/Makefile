CC      = gcc
CFLAGS  = -D_GNU_SOURCE -Wall -Wextra -pedantic -std=c99 
LDFLAGS = -lpthread -lncursesw
COMUNES = semaforo.o memoria.o archivo.o cifrado.o

.PHONY: all clean

all: servidor cliente admin

servidor: servidor.o $(COMUNES)
	$(CC) $(CFLAGS) -o $@ $^ -lpthread

cliente: cliente.o $(COMUNES) interfaz.o
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

admin: admin.o $(COMUNES) interfaz.o
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

%.o: %.c comunes.h
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f *.o servidor cliente admin ipc_shm ipc_sem
	rm -rf datos/
