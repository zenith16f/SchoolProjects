# Guion para el video de presentación

**Entregable:** `EquipoX_CalculadoraIP.mp4` · duración objetivo **6–8 minutos** · 4 integrantes.

> Requisitos del proyecto: el video debe durar entre 6 y 8 minutos, todos los integrantes
> deben participar y **cada uno debe explicar contenido técnico (mínimo 20–30 s) y demostrar
> el funcionamiento** del proyecto. Este guion está calculado para ~7:10 minutos.

---

## 1. Preparación antes de grabar

| Qué | Detalle |
| --- | --- |
| Software | OBS Studio (gratis) o cualquier grabadora de pantalla. |
| Resolución | 1920×1080 a 30 fps (mínimo 720p). Pantalla completa del navegador. |
| Audio | Micrófono o audífonos con mic. Probar el nivel antes: que se oiga claro, sin eco. |
| Navegador | Chrome/Edge. **Zoom al 110–125 %** para que los textos se lean en el video. |
| Preparación | Cerrar pestañas ajenas, silenciar notificaciones (Windows: Asistente de enfoque). |
| Sitio | Levantar la app antes de empezar: doble clic en `iniciar.bat` (o `node servidor.mjs web 4173`). Dejar abiertas 3 pestañas: **Inicio, CIDR, VLSM**. |
| Terminal | Una terminal abierta en la carpeta `codigo-fuente`, lista para correr `pnpm test`. |
| PDF | Tener el PDF `EquipoX_CalculadoraIP.pdf` abierto en la página de portada (se usa al final). |

**Consejo de grabación:** graben por segmentos (uno por integrante) y únanlos al editar:
si alguien se equivoca, solo se repite su segmento, no todo el video. Cada integrante
debe decir su nombre y matrícula al inicio de su participación (los "lower thirds"
con nombre también ayudan, si el editor los agrega).

---

## 2. Reparto y tiempos

| # | Tiempo | Integrante | Tema |
| --- | --- | --- | --- |
| 0 | 0:00 – 0:35 | Integrante 1 | Apertura y presentación del equipo |
| 1 | 0:35 – 2:05 | Integrante 1 | **CIDR:** concepto, demo y casos de error |
| 2 | 2:05 – 3:45 | Integrante 2 | **VLSM:** algoritmo, demo y caso de error |
| 3 | 3:45 – 5:15 | Integrante 3 | Arquitectura, interfaz y accesibilidad |
| 4 | 5:15 – 6:35 | Integrante 4 | Pruebas, calidad y entrega |
| 5 | 6:35 – 7:10 | Los cuatro | Conclusiones (una frase cada uno) |

Cada integrante supera con holgura el mínimo de 20–30 s de contenido técnico.

---

## 3. Guion por segmentos

El texto en **"Decir"** es una guía: pueden leerlo con naturalidad o resumirlo,
mientras cubran los puntos técnicos marcados.

### Segmento 0 · Apertura — Integrante 1 (0:00 – 0:35)

**En pantalla:** página de inicio del sitio (el selector con las dos calculadoras).

**Decir:**
> "Hola, somos el Equipo X de Redes de Computadoras, y este es nuestro Proyecto 2:
> una Calculadora IP para CIDR y VLSM. Al abrirla, lo primero que aparece son las
> dos calculadoras; es una aplicación web que funciona sin internet: todo el
> cálculo ocurre en el navegador. El equipo está formado por
> [nombre, matrícula y rol de cada uno]: [Integrante 1] en la lógica CIDR,
> [Integrante 2] en el algoritmo VLSM, [Integrante 3] en la interfaz y
> [Integrante 4] en documentación, pruebas y entrega. Les mostramos cómo funciona."

---

### Segmento 1 · Calculadora CIDR — Integrante 1 (0:35 – 2:05)

**En pantalla:** pestaña "CIDR".

**Acción 1 — caso típico (192.168.10.0/24):**
Escribir `192.168.10.0` y prefijo `24` (o máscara `255.255.255.0`), presionar Calcular.

**Decir:**
> "La calculadora CIDR responde la pregunta: dada una dirección y una máscara,
> ¿cuál es su red? Aquí la lógica es la que vimos en clase: la dirección de red
> se obtiene con una operación AND entre la IP y la máscara, y el broadcast es
> la última dirección del bloque. Con 192.168.10.0/24: la red es 192.168.10.0,
> el broadcast 192.168.10.255, los hosts útiles van de la .1 a la .254 —
> porque la primera y la última dirección están reservadas — y caben 254 hosts.
> La app también muestra la máscara en formato wildcard, la clase de la dirección
> y si es privada o pública, útil para no usar rangos inválidos."

**Acción 2 — IP con bits de host distintos de cero (172.16.5.130/26):**
Escribir `172.16.5.130` y `26`.

**Decir:**
> "Un caso más interesante: una IP dentro de una subred /26, cuyo host no es cero.
> El sistema recalcula: la red real es 172.16.5.128 y el broadcast 172.16.5.191;
> los hosts van de la .129 a la .190. Con /26 quedan 6 bits de host: 64 direcciones,
> 62 utilizables. En la vista binaria se ve por qué: los últimos 6 bits son los
> que varían dentro de la subred." *(activar la vista binaria si está disponible
> y señalar los bits de red vs. host)*

**Acción 3 — error de validación:**
Escribir `192.168.10.256` (octeto fuera de rango) y calcular; luego una máscara
no contigua como `255.255.255.5`.

**Decir:**
> "También validamos las entradas: un octeto fuera de rango o una máscara no
> contigua producen un mensaje claro, en español, que explica qué corregir —
> no una excepción sin sentido. La validación vive separada del cálculo, así que
> la probamos con pruebas unitarias."

---

### Segmento 2 · Calculadora VLSM — Integrante 2 (2:05 – 3:45)

**En pantalla:** pestaña "VLSM".

**Acción 1 — caso del enunciado (192.168.0.0/24):**
Red base `192.168.0.0`, prefijo `24`; subredes: **A=100, B=50, C=25, D=10**; calcular.

**Decir:**
> "VLSM permite dar a cada subred la máscara que necesita, en lugar de repartir
> por igual. Nuestro algoritmo sigue el método clásico de tres pasos.
> Primero: **ordenamos las subredes de mayor a menor** por los hosts que piden,
> porque las más grandes deben alinearse primero. Segundo: a cada una le
> calculamos **la máscara mínima que la acomoda**: se suman 2 direcciones por la
> de red y broadcast, y se busca la potencia de dos inmediata superior.
> A pide 100 hosts: 102 direcciones, 128 → /25. B pide 50: 52, 64 → /26.
> C pide 25: 27, 32 → /27. Y D pide 10: 12, 16 → /28.
> Tercero: **asignamos bloques contiguos** desde el inicio de la red base,
> avanzando un apuntador: A ocupa 192.168.0.0/25, B 192.168.0.128/26,
> C 192.168.0.192/27, D 192.168.0.224/28. Así nunca se solapan."

**Acción 2 — señalar tabla y métricas:**
Recorrer la tabla de resultados (red, máscara, rango, broadcast) y los totales.

**Decir:**
> "La tabla muestra por subred su red, máscara, primer y último host, broadcast,
> hosts útiles y la **holgura**: los hosts que sobran respecto a lo pedido.
> En total asignamos 240 de las 256 direcciones de la /24, quedan libres 16
> en el bloque 192.168.0.240/28, y la eficiencia es de 90.6 %: casi toda la red
> es espacio útil para hosts. Con subnetting fijo habría desperdiciado mucho más."

**Acción 3 — usar el ejemplo predefinido (opcional, si hay tiempo):**
Clic en el botón **«Campus (5 subredes)»**: base 10.0.0.0/16 con Ventas=500, TI=200,
Recursos Humanos=100, Almacén=50, Dirección=20.

**Decir (breve):**
> "También incluimos un ejemplo de campus: una sola red 10.0.0.0/16 se reparte
> desde /23 para Ventas hasta /27 para Dirección."

**Acción 4 — error de espacio insuficiente:**
Red base `192.168.0.0/24` con **A=200 y B=100**; calcular.

**Decir:**
> "Y si las subredes no caben, no falla en silencio: el aviso dice que la red
> base tiene 256 direcciones, que las subredes necesitan 384, y **sugiere usar
> una /23 o más grande**. Ese mensaje se calcula con la potencia de dos
> inmediata superior a lo requerido."

---

### Segmento 3 · Arquitectura, interfaz y accesibilidad — Integrante 3 (3:45 – 5:15)

**En pantalla:** alternar entre el sitio y el editor de código con `src/lib/`.

**Acción 1 — mostrar la estructura del código:**
Abrir `src/lib/` (ip.ts, subnetting.ts, vlsm.ts) en el editor.

**Decir:**
> "Les cuento cómo está construido por dentro. Elegimos TypeScript para que la
> lógica quede verificada por tipos. La regla más importante de diseño: **el
> cálculo está separado de la interfaz**. En `src/lib` están los tres módulos
> puros — `ip.ts`, `subnetting.ts` y `vlsm.ts` — que no tocan el DOM: reciben
> números y devuelven números. Eso nos permite probarlos con Vitest sin navegador
> y reutilizarlos en cualquier interfaz.
> Otra decisión técnica: en lugar de guardar las direcciones como texto, cada IP
> es **un entero de 32 bits**. Así, la operación AND de la máscara es una sola
> instrucción y no hay errores de redondeo ni de formato al sumar bloques."

**Acción 2 — recorrer la interfaz:**
Volver al sitio, pasar el cursor por los resultados, probar el contraste alto
o el teclado (Tab) si aplica; mostrar la página `/guia/`.

**Decir:**
> "La interfaz es minimalista, con una paleta de gris meteoro y blanco hueso y
> acentos rojo, verde y azul para errores, aciertos e información. Todo el texto
> está en español, con números formateados para nuestro idioma, mensajes de error
> claros y focus visible para navegación con teclado. Incluimos además una página
> de guía dentro de la propia app con la teoría, las fórmulas y los casos comunes,
> para que cualquier compañero pueda estudiar desde el mismo sitio."

**Acción 3 — cómo se ejecuta sin instalar nada:**
Mostrar la carpeta del ZIP y hacer doble clic en `iniciar.bat`.

**Decir:**
> "Para revisarlo no hay que instalar nada: el sitio se genera estático con
> Astro, y en la entrega basta doble clic en `iniciar.bat`, que levanta un
> mini-servidor con Node — son cien líneas sin dependencias — y abre el navegador."

---

### Segmento 4 · Pruebas, calidad y entrega — Integrante 4 (5:15 – 6:35)

**En pantalla:** terminal en `codigo-fuente`.

**Acción 1 — correr las pruebas:**
Ejecutar `pnpm test` (o `npx vitest run`) y dejar ver el resumen: **40 passed**.

**Decir:**
> "La calidad no se demostró a mano: escribimos **40 pruebas unitarias con Vitest**
> que cubren el parseo y validación de direcciones, los análisis CIDR, subnetting
> y el algoritmo VLSM completo, incluidos los casos límite como /31 y /32.
> Además, un script de QA automatizada con Playwright abre el sitio compilado,
> ejecuta **46 verificaciones** — casos felices, errores de validación y el
> mensaje de espacio insuficiente — y confirma que no haya errores en consola.
> De esas corridas generamos las capturas que están en el documento."

**Acción 2 — mostrar el PDF:**
Cambiar al PDF abierto en la portada; hojear rápidamente: portada con datos del
equipo, algoritmo, código comentado, casos de prueba y resultados.

**Decir:**
> "Toda la documentación se entrega en el PDF `EquipoX_CalculadoraIP.pdf`:
> portada con matrículas y correos, introducción, explicación del desarrollo y
> del algoritmo, fragmentos de código comentados, instrucciones de ejecución,
> la tabla de casos de prueba con sus resultados y nuestras conclusiones.
> El PDF se genera con un script, así que siempre está sincronizado con el código."

**Acción 3 — mostrar el ZIP de entrega:**
Abrir `EquipoX_CalculadoraIP.zip` y recorrer el contenido.

**Decir:**
> "La entrega final es el ZIP `EquipoX_CalculadoraIP.zip`: incluye el PDF, el
> sitio web compilado, el servidor, el lanzador, el código fuente completo y las
> evidencias de pruebas. Este video se llama `EquipoX_CalculadoraIP.mp4`, como
> pide el proyecto."

---

### Segmento 5 · Conclusiones — los cuatro (6:35 – 7:10)

**En pantalla:** portada del sitio (o el equipo a cámara). Cada integrante dice
su frase, en orden:

- **Integrante 1:** "Este proyecto nos hizo aplicar el subnetting de verdad:
  ver el AND de la máscara funcionar en la vista binaria le quita el misterio a CIDR."
- **Integrante 2:** "VLSM se entendió cuando vimos que ordenar de mayor a menor
  es lo que evita los solapamientos y deja el espacio libre al final, listo para crecer."
- **Integrante 3:** "Separar la lógica de la interfaz y trabajar con enteros de
  32 bits nos dio cálculos exactos y 40 pruebas que corren en segundos."
- **Integrante 4:** "Aprendimos a entregar como en la industria: código probado,
  documentación generada y un paquete que se ejecuta con doble clic.
  Gracias por ver el video."

---

## 4. Lista de verificación antes de exportar

- [ ] Duración total entre **6 y 8 minutos** (verificar en el reproductor).
- [ ] Los **4 integrantes** hablan y cada uno explica contenido técnico (≥20–30 s).
- [ ] Se demuestran las **dos calculadoras** con los casos del enunciado
      (192.168.10.0/24, 172.16.5.130/26, VLSM A/B/C/D en 192.168.0.0/24).
- [ ] Se muestra al menos **un error de validación** y **el error de espacio insuficiente**.
- [ ] Se ve correr `pnpm test` con sus resultados.
- [ ] Audio audible y sin cortes; resolución ≥1080p; textos del sitio legibles.
- [ ] Nombres y matrículas dichos en cámara o en subtítulos/lower thirds.
- [ ] Archivo final: **`EquipoX_CalculadoraIP.mp4`** (sustituir X por el número real).

> Si un integrante no puede grabar en vivo, puede grabar su segmento por separado
> y unirse en la edición; el requisito es que su voz y su demo aparezcan en el video.
