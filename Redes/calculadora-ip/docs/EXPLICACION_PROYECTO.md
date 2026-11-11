# Explicación completa del proyecto — Calculadora IP (CIDR y VLSM)

Este documento explica el proyecto de principio a fin: la teoría detrás de cada
cálculo, cómo está construido el código, los ejemplos numéricos paso a paso y las
preguntas que el profesor podría hacer. Está pensado como **material de estudio para
la grabación del video**: si entiendes esto, puedes explicar cualquier parte del proyecto.

---

## 1. El proyecto en tres frases

Construimos una **aplicación web** con dos calculadoras de direccionamiento IPv4:

1. **Calculadora CIDR**: recibes una `IP/prefijo` (o IP + máscara) y devuelve la
   **dirección de red, broadcast, rango de hosts utilizables, máscara, wildcard y
   cantidad de hosts**.
2. **Calculadora VLSM**: recibes una red base y una lista de subredes con sus hosts
   requeridos, y devuelve el **plan de subredes contiguas sin solapamientos**, con la
   máscara mínima que necesita cada una y el espacio libre sobrante.
3. Todo es **código abierto local y verificado**: el cálculo ocurre en el navegador
   (no hay servidor de aplicaciones), la lógica está separada de la interfaz y está
   cubierta por **40 pruebas unitarias** y **46 verificaciones automatizadas** de interfaz.

---

## 2. Teoría mínima necesaria (lo que hay que saber explicar)

### 2.1 Dirección IPv4 y máscara

Una dirección IPv4 son **32 bits**, escritos como 4 octetos (192.168.5.130).
Conceptualmente se divide en:

- **Parte de red**: los bits fijos que identifican la subred.
- **Parte de host**: los bits que varían y se asignan a cada equipo.

La **máscara** marca dónde termina la parte de red: sus bits de red son `1` y los de
host son `0`. En notación CIDR, el **prefijo** `/n` dice cuántos bits son de red.
Por ejemplo `/26` → máscara `255.255.255.192` → 26 bits de red y **6 bits de host**.

| Prefijo | Máscara | Bits de host | Direcciones | Hosts útiles |
| --- | --- | --- | --- | --- |
| /24 | 255.255.255.0 | 8 | 256 | 254 |
| /25 | 255.255.255.128 | 7 | 128 | 126 |
| /26 | 255.255.255.192 | 6 | 64 | 62 |
| /27 | 255.255.255.224 | 5 | 32 | 30 |
| /28 | 255.255.255.240 | 4 | 16 | 14 |

### 2.2 Las cuatro operaciones básicas

1. **Dirección de red** = `IP AND máscara` (deja solo los bits de red, host en 0).
2. **Tamaño del bloque** = `2^(32 − prefijo)` direcciones.
3. **Broadcast** = `dirección de red + tamaño − 1` (todos los bits de host en 1).
4. **Hosts útiles** = `2^(bits de host) − 2`, porque la primera dirección es la de
   **red** y la última es el **broadcast**.

> Caso límite: en `/31` la fórmula da 0 hosts útiles (2 − 2), y en `/32` el bloque es
> una sola dirección. La calculadora usa el criterio visto en clase (2^n − 2) y añade
> una nota explicando que la **RFC 3021** permite usar ambas direcciones de un /31 en
> enlaces punto a punto.

### 2.3 Qué es VLSM

**VLSM** (*Variable Length Subnet Mask*) es dividir una red en **subredes de tamaños
distintos**, dándole a cada una solo el espacio que necesita. Es lo contrario del
subnetting "clásico" que divide en partes iguales y desperdicia direcciones.

El algoritmo estándar (el mismo que sigue el proyecto) tiene tres pasos:

1. **Ordenar** las subredes de **mayor a menor** según los hosts que piden.
2. **Calcular la máscara mínima** de cada subred: `hosts + 2` direcciones, redondeando
   a la siguiente **potencia de dos** (porque los bloques CIDR solo pueden medir
   potencias de dos y deben estar alineados).
3. **Asignar bloques contiguos** desde el inicio de la red base, uno tras otro.

**¿Por qué ordenar de mayor a menor?** Porque un bloque grande (p. ej. /25) solo puede
empezar en direcciones alineadas a múltiplos de su tamaño (0, 128, 256…). Si colocas
primero bloques pequeños en el inicio de la red, los grandes pueden quedar sin un
hueco alineado donde caber. Colocando primero los grandes, los pequeños siempre caben
en el hueco que sobra. Ordenar así **garantiza cero solapamientos y desperdicio mínimo**
si la suma de bloques cabe en la red base.

---

## 3. Arquitectura: cómo está construido

```
 Navegador (todo local)
 ┌───────────────────────────────────────────────┐
 │  Páginas Astro (HTML estático + TS en cliente) │
 │  /        selector                             │
 │  /cidr/   calculadora CIDR                     │
 │  /vlsm/   calculadora VLSM                     │
 │  /guia/   guía de estudio                      │
 │                                               │
 │  src/lib/  ◄── LÓGICA PURA (sin DOM)          │
 │   ip.ts         parseo, validación, análisis   │
 │   subnetting.ts máscaras, división, libres     │
 │   vlsm.ts       algoritmo VLSM completo        │
 └───────────────────────────────────────────────┘
        ▲ probado con Vitest (40 pruebas)
        ▲ verificado con Playwright (46 checks)
```

**Decisiones de diseño que conviene explicar en el video:**

- **Astro + TypeScript + Tailwind**. Astro genera un sitio **100 % estático**: no hay
  backend, no se envía nada a ningún servidor, y la entrega se ejecuta con un
  mini-servidor local de Node sin dependencias (`servidor.mjs`, ~100 líneas).
- **Lógica separada de la interfaz**. `src/lib` no importa ni toca el DOM: recibe y
  devuelve números/objetos planos. Por eso la misma lógica se prueba con Vitest y
  alimenta las páginas.
- **Direcciones como enteros de 32 bits, no como texto**. Cada IP se convierte a un
  número entre 0 y 4 294 967 295. La operación AND de la máscara es una sola
  operación de bits, y "avanzar al siguiente bloque" es una suma. Sin errores de
  formato, de acarreo entre octetos ni de precisión.
- **Errores como excepciones tipadas**. `IpError` lleva un **código estable**
  (`INVALID_IP`, `INSUFFICIENT_SPACE`, …): las pruebas validan el código y el
  mensaje; la interfaz solo traduce el mensaje a una alerta en español.

**Archivos principales:**

| Archivo | Contenido |
| --- | --- |
| `src/lib/ip.ts` | Parseo/validación IPv4 y máscaras, análisis CIDR completo (red, broadcast, rango, binario, clase, ámbito privado/público). |
| `src/lib/subnetting.ts` | `prefixForHosts` (máscara mínima), división en subredes iguales y descomposición del espacio libre en bloques CIDR alineados. |
| `src/lib/vlsm.ts` | Algoritmo VLSM: validación, ordenamiento, asignación contigua y métricas (holgura, eficiencia). |
| `src/pages/cidr.astro` / `vlsm.astro` | Interfaz de cada calculadora (formularios, resultados, tabla, mapa de bloques). |
| `tests/` | 40 pruebas unitarias (14 ip + 13 subnetting + 13 vlsm). |
| `scripts/qa.mjs` | QA automatizada en navegador + capturas de pantalla de evidencia. |
| `scripts/export-results.ts` | Genera la tabla de casos de prueba (`docs/resultados.json`, CSV) que alimenta el PDF. |
| `scripts/build-doc.mjs` | Genera el PDF de entrega con Chrome headless (30 páginas). |
| `scripts/empaquetar.mjs` | Arma el ZIP final de entrega. |

---

## 4. Ejemplo numérico 1: CIDR paso a paso

**Caso: `172.16.5.130/26`** (el que aparece en la tabla de pruebas).

Paso 1 — **Convertir a binario**:

```
IP    172 . 16 . 5 . 130  = 10101100 . 00010000 . 00000101 . 10000010
Máscara  /26              = 11111111 . 11111111 . 11111111 . 11000000  (255.255.255.192)
```

Paso 2 — **IP AND máscara** = dirección de red (se conservan solo los 26 bits de red):

```
Red   10101100 . 00010000 . 00000101 . 10000000  = 172.16.5.128
```

Paso 3 — **Tamaño del bloque**: `/26` → 6 bits de host → `2^6 = 64` direcciones
(.128 a .191).

Paso 4 — **Broadcast** = red + 64 − 1 = **172.16.5.191** (todos los bits de host en 1).

Paso 5 — **Rango útil** = .129 a .190 → `64 − 2 = 62` hosts utilizables.

La calculadora muestra además: wildcard `0.0.0.63` (complemento de la máscara, útil
en ACLs), la clase histórica (B) y el ámbito (privada, RFC 1918).

**Validaciones del mismo módulo** (buenas para demostrar en el video):

- `192.168.10.256` → "El octeto 4 ("256") debe estar entre 0 y 255."
- `192.168.05.1` → rechaza ceros a la izquierda (evita ambigüedades).
- Máscara `255.255.255.5` → "La máscara no es contigua. Ejemplos válidos:
  255.255.255.0 o 255.255.254.0." (los unos de una máscara CIDR deben ser contiguos
  desde la izquierda; el código lo verifica con un truco de bits: el complemento de
  una máscara válida siempre es de la forma `2^k − 1`).

---

## 5. Ejemplo numérico 2: VLSM paso a paso

**Caso del enunciado: base `192.168.0.0/24` con A=100, B=50, C=25 y D=10 hosts.**

La /24 tiene 256 direcciones (.0 a .255). Paso 1 — ordenar de mayor a menor:
A (100) → B (50) → C (25) → D (10).

Paso 2 — máscara mínima por subred (recordar: `hosts + 2`, redondear a potencia de dos):

| Subred | Hosts | Necesita (hosts+2) | Potencia de dos | Bloque | Máscara |
| --- | --- | --- | --- | --- | --- |
| A | 100 | 102 | 128 | 128 dir. | **/25** |
| B | 50 | 52 | 64 | 64 dir. | **/26** |
| C | 25 | 27 | 32 | 32 dir. | **/27** |
| D | 10 | 12 | 16 | 16 dir. | **/28** |

Paso 3 — asignación contigua con un apuntador que avanza:

| # | Subred | Bloque asignado | Red | Broadcast | Hosts útiles | Holgura |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | A | 192.168.0.0/25 | .0 | .127 | 126 | 126−100 = 26 |
| 2 | B | 192.168.0.128/26 | .128 | .191 | 62 | 62−50 = 12 |
| 3 | C | 192.168.0.192/27 | .192 | .223 | 30 | 30−25 = 5 |
| 4 | D | 192.168.0.224/28 | .224 | .239 | 14 | 14−10 = 4 |

El apuntador termina en .240. El espacio que queda (.240 a .255, 16 direcciones)
se descompone en **bloques libres alineados**: `192.168.0.240/28` (un solo bloque,
porque .240 es múltiplo de 16 pero no de 32).

**Métricas finales que muestra la app:**

- Asignadas: 240 de 256 direcciones. Libres: 16.
- Hosts útiles totales: 126 + 62 + 30 + 14 = **232**.
- Reservadas (red+broadcast de cada subred): 2 × 4 = **8**.
- Holgura total (útiles no pedidos): 26 + 12 + 5 + 4 = **47**.
- **Eficiencia = 232 / 256 = 90.6 %** del espacio de la base sirve para hosts.

*Si la misma red se dividiera con subnetting fijo para la peor subred (100 hosts →
todas /25), solo cabrían 2 subredes; con VLSM caben 4 y aún sobra espacio.*

---

## 6. Ejemplo numérico 3: el error de espacio insuficiente

**Caso: base `192.168.0.0/24` con A=200 y B=100.**

- A=200 → 202 direcciones → 256 → /24 (¡la red completa!).
- B=100 → 102 → 128 → /25.
- Suma de bloques: 256 + 128 = **384 > 256**.

Antes de asignar nada, el algoritmo valida la suma y lanza un error que sugiere la
red mínima que sí sirve: la potencia de dos ≥ 384 es 512 → **/23**. El mensaje exacto:

> "La red base 192.168.0.0/24 tiene 256 direcciones, pero las subredes necesitan 384.
> Prueba con una red base /23 o más grande."

Con `192.168.0.0/23` (512 direcciones) el mismo plan sí cabe. Vale la pena demostrar
ambos en el video: primero el error, luego cambiar la base a /23 y recalcular.

---

## 6b. Ejemplo numérico 4: campus (preset de la app)

Base `10.0.0.0/16` (65 536 direcciones):

| Subred | Hosts | Necesita | Bloque | Asignación |
| --- | --- | --- | --- | --- |
| Ventas | 500 | 502 | 512 | 10.0.0.0/23 |
| TI | 200 | 202 | 256 | 10.0.2.0/24 |
| Recursos Humanos | 100 | 102 | 128 | 10.0.3.0/25 |
| Almacén | 50 | 52 | 64 | 10.0.3.128/26 |
| Dirección | 20 | 22 | 32 | 10.0.3.192/27 |

Libre a partir de 10.0.3.224. Nótese cómo las subredes pequeñas reutilizan el
espacio que dejó Ventas (que ocupó "2 octetos y medio"): esa es la gracia de VLSM.

---

## 7. Recorrido rápido del código (para quien explica la implementación)

### `src/lib/ip.ts` — núcleo IPv4

- `parseIPv4(texto) → número`: valida 4 octetos, dígitos, rango 0–255, sin ceros a la
  izquierda. Convierte con `result = result*256 + octeto` (equivale a desplazar 8 bits
  pero sin los problemas de signo de los operadores de bits de JS).
- `networkAddress(ip, prefijo)` = `ip AND máscara`; `broadcastAddress(red, prefijo)` =
  `red + 2^(32−prefijo) − 1`.
- `maskToPrefix(máscara)`: valida que los unos sean contiguos (truco: `~máscara` debe
  ser de la forma `2^k − 1`; se comprueba con `inverted & (inverted + 1) === 0`).
- `analyzeCidrFromValues(...)`: junta todo en un objeto con textos decimales y
  binarios, clase (A–E) y ámbito (privada/pública/loopback… según RFC 1918 y otros).

### `src/lib/subnetting.ts` — utilidades de división

- `prefixForHosts(hosts)`: el corazón del cálculo de máscara mínima:
  `needed = hosts + 2`; sube `hostBits` hasta `2^hostBits >= needed`; devuelve
  `32 − hostBits`.
- `splitByPrefix(...)`: división clásica en subredes iguales (la que NO usamos en el
  resultado VLSM, pero sirve para comparar y para la guía).
- `freeBlocksBetween(inicio, fin)`: descompone el espacio libre en los **bloques
  alineados más grandes posibles** (va duplicando el bloque mientras siga alineado
  y quepa). Por eso el libre `.240–.255` se reporta como un solo `.240/28`.

### `src/lib/vlsm.ts` — el algoritmo VLSM

1. Normaliza y valida requerimientos (nombres, hosts enteros ≥ 1, prefijo alcanzable).
2. Ordena por `hosts + 2` descendente (empates: orden de captura — determinista).
3. **Validación global**: suma de tamaños de bloque ≤ tamaño de la base; si no,
   lanza `INSUFFICIENT_SPACE` con la sugerencia de prefijo.
4. Asigna con `pointer += blockSize` y una salvaguarda por subred (el bloque debe
   terminar dentro del broadcast de la base).
5. Calcula métricas: holgura por subred (`útiles − pedidos`), direcciones reservadas
   (red+broadcast), libres y eficiencia (`útiles / tamaño de la base`).

---

## 8. Pruebas y calidad (números que conviene citar)

- **40 pruebas unitarias** (Vitest, `pnpm test`): 14 de `ip.ts`, 13 de `subnetting.ts`
  y 13 de `vlsm.ts`. Cubren casos normales, límite (/31, /32, /0), binario, errores
  de validación, ordenamiento VLSM, solapamientos y sugerencia de prefijo.
- **46 verificaciones de QA** (Playwright sobre el sitio compilado): casos felices de
  ambas calculadoras, mensajes de error en pantalla, coherencia de la tabla VLSM y
  **cero errores de consola**. Cada corrida genera las capturas de `docs/capturas/`.
- **`astro check`**: tipado TypeScript sin errores.
- Los resultados de las tablas del PDF se generan con `scripts/export-results.ts`,
  es decir, salieron de ejecutar el código real, no se escribieron a mano.

---

## 9. Preguntas probables del profesor (y respuestas)

**¿Por qué los hosts utilizables son 2^n − 2?**
Porque en cada subred la primera dirección es la de red y la última es el broadcast;
ambas están reservadas y no se asignan a hosts. En /31 la resta da 0, y la app lo
aclara con una nota sobre la RFC 3021 (enlaces punto a punto).

**¿Por qué ordenan las subredes de mayor a menor en VLSM?**
Por la alineación: un bloque de tamaño 2^k solo puede iniciar en múltiplos de 2^k.
Colocando primero los bloques grandes garantizamos que los pequeños rellenen los
huecos; al revés, un bloque grande podría quedarse sin hueco alineado aunque hubiera
espacio total suficiente. Además hace el resultado determinista y reproducible.

**¿Cómo garantizan que no haya solapamientos?**
Triple: (1) la validación global de suma, (2) un único apuntador que avanza de forma
contigua y nunca retrocede, y (3) una comprobación por subred de que el bloque termina
antes del broadcast de la base. También está cubierto por pruebas.

**¿Por qué trabajan con enteros y no con cadenas?**
Por corrección y simplicidad: `IP AND máscara` es una instrucción, el siguiente bloque
es una suma, y no hay que propagar acarreos entre octetos. Además JavaScript opera a 32
bits con `>>> 0` para mantener el resultado sin signo.

**¿Por qué rechazan máscaras como 255.255.255.5?**
Porque en CIDR la máscara representa un prefijo: los unos deben ser contiguos desde la
izquierda. Una máscara discontigua no corresponde a ningún prefijo /n y no se puede
usar para definir subredes válidas.

**¿Qué significa la "holgura" que muestra la tabla?**
Los hosts útiles que sobran en la subred respecto de lo pedido: `útiles − pedidos`.
Es el desperdicio inevitable de redondear al bloque de potencia de dos; VLSM lo
minimiza eligiendo la máscara mínima.

**¿Por qué la eficiencia es 90.6 % y no 100 %?**
Porque se descuentan (a) las direcciones de red y broadcast de cada subred (8 en el
ejemplo) y (b) la holgura de redondeo (47). 232 de 256 direcciones sirven para hosts.

**¿Qué pasa si piden una subred con 0 hosts o con nombre vacío?**
Se valida antes de calcular: `IpError` con código `INVALID_HOSTS` o
`EMPTY_REQUIREMENTS`, y la interfaz muestra el mensaje en español indicando qué
corregir. No se produce ninguna asignación parcial.

**¿Por qué un sitio estático y no un backend?**
El proyecto no necesita guardar nada: los cálculos son deterministas y ocurren en el
navegador. Así la entrega es una carpeta que corre con `iniciar.bat` y un servidor de
~100 líneas, sin instalar dependencias ni configurar nada.

**¿Cómo sé que su calculadora está bien y no inventa?**
La lógica está aislada en `src/lib` y cubierta por 40 pruebas unitarias; los casos
del PDF salen de ejecutar el código real (`scripts/export-results.ts`); y cualquier
resultado se puede verificar a mano con las operaciones de la sección 2.2.

**¿Dónde está el código que hace el AND de la máscara?**
En `src/lib/ip.ts`: `networkAddress(ip, prefix)` usa `ip & prefixToMask(prefix)`.
Y `prefixToMask` construye la máscara desplazando `0xffffffff << (32 − prefix)`.

---

## 10. Glosario exprés (para hablar con precisión en el video)

- **Prefijo /n**: número de bits de red (los unos de la máscara).
- **Wildcard**: complemento de la máscara (útil en ACLs); /26 → `0.0.0.63`.
- **Bloque**: conjunto de 2^(32−n) direcciones de una /n.
- **Alineación**: un bloque /n solo puede iniciar en múltiplos de su tamaño.
- **Holgura (waste)**: hosts útiles de la subred menos los pedidos.
- **Espacio libre**: direcciones de la base sin asignar, reportadas como bloques CIDR.
- **RFC 1918**: rangos privados (10/8, 172.16/12, 192.168/16).
- **RFC 3021**: uso de /31 en enlaces punto a punto.

---

## 11. Checklist de la grabación

1. Levanta el sitio antes de grabar (`iniciar.bat` → http://127.0.0.1:4173/).
2. Ensayar una vez cada demo con los valores de las secciones 4, 5 y 6.
3. Seguir el guion de `docs/Guion_Video.md` (segmentos y tiempos).
4. Cada integrante debe poder responder las preguntas de la sección 9 de su área.
5. Exportar como `EquipoX_CalculadoraIP.mp4` (6–8 min).
