//* Includes
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <unistd.h>

//* Types and Structures
typedef enum
{
	ENTERO,
	VARCHAR,
} TipoDato;

typedef struct Campo
{
	char *nombre;
	int longitud;
	TipoDato tipo;
	struct Campo *siguiente;
} Campo;

typedef struct Registro
{
	void **datos;
	struct Registro *siguiente;
	struct Registro *anterior;
} Registro;

typedef struct Tabla
{
	char nombre[50];
	Campo *campos;
	Registro *registros;
	int numCampos;
	int numRegistros;
	struct Tabla *siguiente;
} Tabla;

typedef struct
{
	Tabla *tablas;
	int numTablas;
} BaseDatos;

//*Prototypes
void agregarTabla(BaseDatos **base, char *nombreTabla);
Tabla *buscarTablaEnBd(BaseDatos *base, char *nombreTabla);
void cargarRegistrosDesdeArchivo(Tabla *tabla, const char *rutaArchivo);
void guardarRegistroEnArchivo(Tabla *tabla, Registro *registro);
void guardarEsquemaTabla(Tabla *tabla);
void crearTablaDesdeSchema(BaseDatos **base, const char *nombreTabla, const char *rutaSchema);
void limpiarRegistros(Tabla *tabla);

//* Fuctions
void inicializarDesdeArchivos(BaseDatos **base, const char *carpeta)
{
	DIR *dir;
	struct dirent *ent;

	dir = opendir(carpeta);
	if (dir == NULL)
	{
		perror("No se pudo abrir el directorio");
		return;
	}

	while ((ent = readdir(dir)) != NULL)
	{
		// Filtrar archivos .txt
		if (strstr(ent->d_name, ".txt") != NULL)
		{
			char rutaArchivo[256];
			snprintf(rutaArchivo, sizeof(rutaArchivo), "%s/%s", carpeta, ent->d_name);

			// Nombre de tabla (sin extensión)
			char nombreTabla[50];
			strncpy(nombreTabla, ent->d_name, sizeof(nombreTabla));
			nombreTabla[strlen(nombreTabla) - 4] = '\0'; // Quitar ".txt"

			// Buscar tabla en base
			Tabla *tabla = buscarTablaEnBd(*base, nombreTabla);

			// Cargar estructura desde archivo .schema
			char rutaSchema[256];
			snprintf(rutaSchema, sizeof(rutaSchema), "%s/%s.schema", carpeta, nombreTabla);
			if (access(rutaSchema, F_OK) == 0)
			{
				crearTablaDesdeSchema(base, nombreTabla, rutaSchema);
			}
			else
			{
				agregarTabla(base, nombreTabla); // Por si acaso no hay esquema
			}

			// Abrir archivo para contar campos
			FILE *archivo = fopen(rutaArchivo, "r");
			if (!archivo || !tabla)
				continue;

			char linea[512];
			if (fgets(linea, sizeof(linea), archivo))
			{
				// Contar campos por comas
				int campos = 1;
				for (char *p = linea; *p; p++)
					if (*p == ',')
						campos++;

				// Reasignar campos
				tabla->numCampos = campos;
				tabla->campos = (Campo *)malloc(campos * sizeof(Campo));
				for (int i = 0; i < campos; i++)
				{
					tabla->campos[i].nombre = malloc(20);
					sprintf(tabla->campos[i].nombre, "Campo%d", i + 1);
					tabla->campos[i].longitud = 100;
					tabla->campos[i].tipo = VARCHAR;
					tabla->campos[i].siguiente = (i < campos - 1) ? &tabla->campos[i + 1] : NULL;
				}

				fclose(archivo);

				cargarRegistrosDesdeArchivo(tabla, rutaArchivo);
				printf("Tabla '%s' inicializada con %d campos desde archivo.\n", nombreTabla, campos);
			}
		}
	}
	closedir(dir);
}

// Get Fields
void agregarCampos(BaseDatos **base, Tabla *tabla)
{
	if (tabla == NULL)
	{
		printf("Tabla no encontrada.\n");
		return;
	}

	for (int i = 0; i < tabla->numCampos; i++)
	{
		tabla->campos[i].nombre = (char *)malloc(50 * sizeof(char));
		printf("Ingrese el nombre del campo %d: ", i + 1);
		scanf("%s", tabla->campos[i].nombre);

		printf("Ingrese la longitud del campo %d: ", i + 1);
		scanf("%d", &tabla->campos[i].longitud);

		int tipo;
		printf("Ingrese el tipo de dato del campo %d (0 para ENTERO, 1 para VARCHAR): ", i + 1);
		scanf("%d", &tipo);

		if (tipo < 0 || tipo > 1) // Validar tipo de dato (Opcional)
		{
			printf("Tipo de dato invalido. Asignando VARCHAR por defecto.\n");
			tipo = 1; // Asignar VARCHAR por defecto si el tipo es invalido
		}

		tabla->campos[i].tipo = (tipo == 0) ? ENTERO : VARCHAR;

		if (i < tabla->numCampos - 1)
		{
			tabla->campos[i].siguiente = &tabla->campos[i + 1];
		}
		else
		{
			tabla->campos[i].siguiente = NULL; // El ultimo campo no apunta a otro
		}
	}
}

// Add Table
void agregarTabla(BaseDatos **base, char *nombreTabla)
{
	if (*base == NULL)
	{
		*base = (BaseDatos *)malloc(sizeof(BaseDatos));
		(*base)->tablas = NULL;
		(*base)->numTablas = 0;
	}

	Tabla *nuevaTabla = (Tabla *)malloc(sizeof(Tabla));
	strcpy(nuevaTabla->nombre, nombreTabla);

	printf("\nIngrese el numero de campos para la tabla '%s': ", nombreTabla);
	int numCampos;
	scanf("%d", &numCampos);
	if (numCampos <= 0)
	{
		printf("El numero de campos debe ser mayor que 0.\n");
		free(nuevaTabla);
		return;
	}
	nuevaTabla->numCampos = numCampos;

	nuevaTabla->campos = (Campo *)malloc(numCampos * sizeof(Campo));
	agregarCampos(base, nuevaTabla);

	guardarEsquemaTabla(nuevaTabla);

	nuevaTabla->registros = NULL;
	nuevaTabla->numRegistros = 0;
	nuevaTabla->siguiente = (*base)->tablas;

	(*base)->tablas = nuevaTabla;
	(*base)->numTablas++;

	printf("Tabla '%s' agregada exitosamente.\n", nombreTabla);
};

// Search Table
Tabla *buscarTablaEnBd(BaseDatos *base, char *nombreTabla)
{
	if (base == NULL || base->tablas == NULL)
	{
		return NULL;
	}

	Tabla *tablaActual = base->tablas;
	while (tablaActual != NULL)
	{
		if (strcmp(tablaActual->nombre, nombreTabla) == 0)
		{
			return tablaActual;
		}
		tablaActual = tablaActual->siguiente;
	}
	return NULL;
}

// Show Fields
void mostrarCampos(Tabla *tabla)
{
	if (tabla == NULL)
	{
		printf("Tabla no encontrada.\n");
		return;
	}

	printf("Numero de campos en la tabla '%s': %d\n", tabla->nombre, tabla->numCampos);
	printf("Campos en la tabla '%s':\n", tabla->nombre);
	Campo *campoActual = tabla->campos;
	while (campoActual != NULL)
	{
		printf(" - %s (%d) ", campoActual->nombre, campoActual->longitud);
		if (campoActual->tipo == ENTERO)
		{
			printf("[ENTERO]\n");
		}
		else if (campoActual->tipo == VARCHAR)
		{
			printf("[VARCHAR]\n");
		}
		campoActual = campoActual->siguiente;
	}
	printf("\n");
}

// Show Tables
void mostrarTabla(BaseDatos *base, char *nombreTabla)
{
	Tabla *tabla = buscarTablaEnBd(base, nombreTabla);
	if (tabla == NULL)
	{
		printf("Tabla '%s' no encontrada.\n", nombreTabla);
		return;
	}

	char rutaArchivo[100];
	sprintf(rutaArchivo, "%s.txt", nombreTabla);
	cargarRegistrosDesdeArchivo(tabla, rutaArchivo);

	printf("Tabla: %s\n", tabla->nombre);
	mostrarCampos(tabla);
};

// Add Record
void agregarRegistroDatos(Tabla *tabla, Registro *nuevoRegistro)
{
	if (tabla == NULL || nuevoRegistro == NULL)
	{
		printf("Tabla o registro no valido.\n");
		return;
	}

	if (tabla->registros == NULL)
	{
		tabla->registros = nuevoRegistro;
		nuevoRegistro->anterior = NULL;
	}
	else
	{
		Registro *ultimoRegistro = tabla->registros;
		while (ultimoRegistro->siguiente != NULL)
		{
			ultimoRegistro = ultimoRegistro->siguiente;
		}
		ultimoRegistro->siguiente = nuevoRegistro;
		nuevoRegistro->anterior = ultimoRegistro;
	}

	tabla->numRegistros++;
	nuevoRegistro->siguiente = NULL;
}

void anadirRegistro(BaseDatos *base, char *nombreTabla)
{
	Tabla *tabla = buscarTablaEnBd(base, nombreTabla);
	if (tabla == NULL)
	{
		printf("Tabla '%s' no encontrada.\n", nombreTabla);
		return;
	}

	printf("Ingrese el numero de nuevos registros a agregar: ");
	int numNuevosRegistros, contador = 1;
	scanf("%d", &numNuevosRegistros);

	if (numNuevosRegistros <= 0)
	{
		printf("El numero de nuevos registros debe ser mayor que 0.\n");
		return;
	}

	while (numNuevosRegistros-- > 0)
	{
		Registro *nuevoRegistro = (Registro *)malloc(sizeof(Registro));
		nuevoRegistro->datos = (void **)malloc(tabla->numCampos * sizeof(void *));

		Campo *campoActual = tabla->campos; // Puntero al primer campo
		for (int i = 0; i < tabla->numCampos; i++, campoActual++)
		{
			nuevoRegistro->datos[i] = malloc(campoActual->longitud * sizeof(char));
			printf("Ingrese el valor para el campo '%s' (tipo %s) del registro numero %d: ",
				   campoActual->nombre,
				   (campoActual->tipo == ENTERO) ? "ENTERO" : "VARCHAR",
				   contador);

			if (campoActual->tipo == ENTERO)
			{
				int valor;
				scanf("%d", &valor);
				sprintf(*(char **)(nuevoRegistro->datos + i), "%d", valor);
			}
			else if (campoActual->tipo == VARCHAR)
			{
				getchar(); // Limpia el salto de línea pendiente en el buffer
				fgets(*(char **)(nuevoRegistro->datos + i), campoActual->longitud, stdin);

				// Elimina el salto de línea final si quedó
				char *pos = strchr(*(char **)(nuevoRegistro->datos + i), '\n');
				if (pos != NULL)
					*pos = '\0';
			}
		}
		agregarRegistroDatos(tabla, nuevoRegistro);
		guardarRegistroEnArchivo(tabla, nuevoRegistro);
		contador++;
	}
}

// Show Records
void mostrarRegistros(BaseDatos *base, char *nombreTabla)
{
	Tabla *tabla = buscarTablaEnBd(base, nombreTabla);
	if (tabla == NULL)
	{
		printf("Tabla '%s' no encontrada.\n", nombreTabla);
		return;
	}

	char rutaArchivo[100];
	sprintf(rutaArchivo, "%s.txt", nombreTabla);
	limpiarRegistros(tabla);
	cargarRegistrosDesdeArchivo(tabla, rutaArchivo);

	printf("Numero de registros en la tabla '%s': %d\n", tabla->nombre, tabla->numRegistros);
	printf("Ingrese el numero de registros a mostrar (0 para mostrar todos): ");
	int numRegistros;
	scanf("%d", &numRegistros);

	printf("\nTabla: %s\n", tabla->nombre);
	printf("Registros en la tabla '%s':\n", tabla->nombre);
	Registro *registroActual = tabla->registros;

	if (numRegistros <= 0 || numRegistros > tabla->numRegistros)
	{
		numRegistros = tabla->numRegistros;
	}

	while (registroActual != NULL && numRegistros-- > 0)
	{
		Campo *campoActual = tabla->campos;
		for (int i = 0; i < tabla->numCampos; i++, campoActual++)
		{
			void **dato = registroActual->datos + i;
			if (*dato != NULL)
				printf(" - %s: %s", campoActual->nombre, *(char **)dato);
			else
				printf(" - %s: NULL", campoActual->nombre);
		}
		printf("\n");
		registroActual = registroActual->siguiente;
	}
}

// Archives
void guardarRegistroEnArchivo(Tabla *tabla, Registro *registro)
{
	if (tabla == NULL || registro == NULL)
		return;

	char nombreArchivo[100];
	sprintf(nombreArchivo, "%s.txt", tabla->nombre);

	FILE *archivo = fopen(nombreArchivo, "a");
	if (!archivo)
	{
		perror("Error al abrir el archivo para guardar el registro");
		return;
	}

	Campo *campoActual = tabla->campos;
	for (int i = 0; i < tabla->numCampos; i++, campoActual++)
	{
		fprintf(archivo, "%s", *(char **)(registro->datos + i));
		if (i < tabla->numCampos - 1)
			fprintf(archivo, ",");
	}
	fprintf(archivo, "\n");

	fclose(archivo);
}

void cargarEstructuraDesdeArchivo(Tabla *tabla, const char *rutaSchema)
{
	if (tabla == NULL || rutaSchema == NULL)
	{
		printf("Tabla o ruta inválida.\n");
		return;
	}

	FILE *archivo = fopen(rutaSchema, "r");
	if (!archivo)
	{
		perror("No se pudo abrir el archivo de esquema");
		return;
	}

	char linea[256];
	int numCampos = 0;

	// Primera pasada: contar cuántos campos hay
	while (fgets(linea, sizeof(linea), archivo) != NULL)
	{
		numCampos++;
	}
	rewind(archivo); // Volver al inicio para volver a leer

	// Asignar espacio a los campos
	tabla->numCampos = numCampos;
	tabla->campos = (Campo *)malloc(numCampos * sizeof(Campo));
	Campo *campoActual = tabla->campos; // Puntero al primer campo

	for (int i = 0; i < numCampos; i++, campoActual++)
	{
		if (!fgets(linea, sizeof(linea), archivo))
			break;

		// Eliminar salto de línea
		char *salto = strchr(linea, '\n');
		if (salto)
			*salto = '\0';

		char *token = strtok(linea, ",");
		if (!token)
			continue;

		campoActual->nombre = (char *)malloc(50);
		strcpy(campoActual->nombre, token);

		token = strtok(NULL, ",");
		if (!token)
			continue;
		if (strcmp(token, "ENTERO") == 0)
			campoActual->tipo = ENTERO;
		else
			campoActual->tipo = VARCHAR;

		token = strtok(NULL, ",");
		campoActual->longitud = token ? atoi(token) : 100;

		campoActual->siguiente = (i < numCampos - 1) ? campoActual + 1 : NULL;
	}

	fclose(archivo);
	printf("Estructura de la tabla '%s' cargada correctamente.\n", tabla->nombre);
}

void cargarRegistrosDesdeArchivo(Tabla *tabla, const char *rutaArchivo)
{
	FILE *archivo = fopen(rutaArchivo, "r");
	if (!archivo)
	{
		perror("No se pudo abrir el archivo de registros");
		return;
	}

	char linea[512];
	// Leer cada línea de registro
	while (fgets(linea, sizeof(linea), archivo))
	{
		if (strlen(linea) <= 1)
			continue; // Línea vacía

		linea[strcspn(linea, "\r\n")] = '\0'; // Elimina \r o \n si están presentes

		Registro *nuevoRegistro = (Registro *)malloc(sizeof(Registro));
		nuevoRegistro->datos = (void **)malloc(tabla->numCampos * sizeof(void *));
		nuevoRegistro->siguiente = NULL;
		nuevoRegistro->anterior = NULL;

		char *token = strtok(linea, ",\r\n");
		Campo *campoActual = tabla->campos; // Puntero al primer campo

		for (int i = 0; i < tabla->numCampos && token != NULL; i++, campoActual++)
		{
			*(nuevoRegistro->datos + i) = malloc(campoActual->longitud * sizeof(char));
			strncpy(*(char **)(nuevoRegistro->datos + i), token, campoActual->longitud - 1);
			(*(char **)(nuevoRegistro->datos + i))[campoActual->longitud - 1] = '\0';

			char *p = *(char **)(nuevoRegistro->datos + i);
			p[strcspn(p, "\r\n")] = '\0';

			token = strtok(NULL, ",\n");
		}

		agregarRegistroDatos(tabla, nuevoRegistro);
	}

	fclose(archivo);
}

// Tables
void guardarEsquemaTabla(Tabla *tabla)
{
	if (!tabla || !tabla->campos)
		return;

	char archivo[100];
	sprintf(archivo, "%s.schema", tabla->nombre); // archivo: nombreTabla.schema

	FILE *f = fopen(archivo, "w");
	if (!f)
	{
		perror("No se pudo guardar el esquema");
		return;
	}

	Campo *c = tabla->campos;
	while (c != NULL)
	{
		fprintf(f, "%s,%s,%d\n",
				c->nombre,
				(c->tipo == ENTERO) ? "ENTERO" : "VARCHAR",
				c->longitud);
		c = c->siguiente;
	}

	fclose(f);
	printf("Esquema de tabla '%s' guardado en %s\n", tabla->nombre, archivo);
}

void crearTablaDesdeSchema(BaseDatos **base, const char *nombreTabla, const char *rutaSchema)
{
	if (*base == NULL)
	{
		*base = (BaseDatos *)malloc(sizeof(BaseDatos));
		(*base)->tablas = NULL;
		(*base)->numTablas = 0;
	}

	Tabla *nuevaTabla = (Tabla *)malloc(sizeof(Tabla));
	strcpy(nuevaTabla->nombre, nombreTabla);

	// Cargar estructura
	cargarEstructuraDesdeArchivo(nuevaTabla, rutaSchema);

	nuevaTabla->registros = NULL;
	nuevaTabla->numRegistros = 0;
	nuevaTabla->siguiente = (*base)->tablas;
	(*base)->tablas = nuevaTabla;
	(*base)->numTablas++;
}

// Clean
void limpiarRegistros(Tabla *tabla)
{
	if (!tabla || !tabla->registros)
		return;

	Registro *actual = tabla->registros;
	while (actual)
	{
		Registro *siguiente = actual->siguiente;
		for (int i = 0; i < tabla->numCampos; i++)
		{
			free(actual->datos[i]);
		}
		free(actual->datos);
		free(actual);
		actual = siguiente;
	}
	tabla->registros = NULL;
	tabla->numRegistros = 0;
}

//* Main
int main()
{
	// Variables
	BaseDatos *baseDatos = NULL;
	inicializarDesdeArchivos(&baseDatos, ".");
	int opcion, continuar = 1;

	printf("Bienvenido al Gestor de Base de Datos\n");

	while (continuar)
	{

		printf("\nMenu:\n");
		printf("1. Agregar Tabla\n");
		printf("2. Mostrar Tabla\n");
		printf("3. Agregar Registro\n");
		printf("4. Mostrar Registros\n");
		printf("0. Salir\n");
		printf("Seleccione una opcion: ");
		scanf("%d", &opcion);
		switch (opcion)
		{
			{
			case 1:
			{
				char nombreTabla[50];
				printf("\nIngrese el nombre de la tabla: ");
				scanf("%s", nombreTabla);
				agregarTabla(&baseDatos, nombreTabla);
				printf("Tabla '%s' agregada exitosamente.\n", nombreTabla);
			}
			break;

			case 2:
			{
				char nombreTabla[50];
				printf("\nIngrese el nombre de la tabla a mostrar: ");
				scanf("%s", nombreTabla);
				mostrarTabla(baseDatos, nombreTabla);
			}
			break;

			case 3:
			{
				char nombreTabla[50];
				printf("\nIngrese el nombre de la tabla para agregar un registro: ");
				scanf("%s", nombreTabla);
				anadirRegistro(baseDatos, nombreTabla);
			}
			break;

			case 4:
			{
				char nombreTabla[50];
				printf("\nIngrese el nombre de la tabla para mostrar los registros: ");
				scanf("%s", nombreTabla);
				mostrarRegistros(baseDatos, nombreTabla);
			}
			break;

			case 0:
				printf("\nSaliendo del gestor de base de datos.\n");
				continuar = 0;
				break;

			default:
				printf("Opcion no valida. Intente de nuevo.\n");
				break;
			}
		}
	}
	return 0;
}
