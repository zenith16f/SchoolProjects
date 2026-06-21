CC      = gcc
CFLAGS  = -D_GNU_SOURCE -Wall -Wextra -pedantic -std=c99 
LDFLAGS = -lpthread -lncursesw
COMUNES =  semaforo.o memoria.o archivo.o cifrado.o
TARGET = cliente.o admin.o interfaz.o 
.PHONY: all clean

all: anime servidor

servidor: servidor.o $(COMUNES)
	$(CC) $(CFLAGS) -o $@ $^ -lpthread

anime: anime.o $(TARGET) $(COMUNES)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

%.o: %.c comunes.h
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f *.o servidor anime ipc_shm ipc_sem
	rm -rf datos/
