# Calculadora IP · CIDR y VLSM

Sitio web con dos calculadoras de direccionamiento IPv4 para el **Proyecto 2** de la materia
**Redes de Computadoras** (ESCOM · IPN):

- **Calculadora CIDR** — dado `IP/prefijo` (o `IP máscara`), calcula dirección de red, broadcast,
  rango de hosts utilizables, máscara, wildcard, cantidad de hosts, clase, ámbito (privada/pública)
  y representación binaria por octetos.
- **Calculadora VLSM** — dada una red base y una lista de subredes con su cantidad de hosts,
  asigna bloques contiguos **de mayor a menor**, con la máscara mínima que acomoda cada subred,
  sin solapamientos, y muestra el espacio libre restante.
- **Guía de estudio** — teoría, fórmulas y casos comunes dentro del propio sitio (`/guia/`).

Todo el cálculo ocurre **en el navegador**: el sitio es 100 % estático, no hay backend ni envío
de datos a ningún servidor.

---

## Ejecutar el proyecto

### Opción A · Desde el ZIP de entrega (recomendada para revisión)

Requisitos: tener **Node.js 22+** instalado (solo para el servidor local; no se instala nada más).

1. Descomprime el ZIP.
2. Doble clic en **`iniciar.bat`** (Windows). Se abre el navegador en `http://127.0.0.1:4173/`.

Alternativa manual, en cualquier sistema operativo:

```bash
node servidor.mjs web 4173
# luego abre http://127.0.0.1:4173/
```

El sitio compilado está en `web/` (es una copia de `dist/` del código fuente).

### Opción B · Desde el código fuente (desarrollo)

Requisitos: **Node.js 22+** y **pnpm 10+**.

```bash
pnpm install          # dependencias
pnpm dev              # servidor de desarrollo en http://127.0.0.1:4321/
```

### Comandos

| Comando             | Qué hace                                                              |
| ------------------- | --------------------------------------------------------------------- |
| `pnpm install`      | Instala las dependencias.                                              |
| `pnpm dev`          | Servidor de desarrollo con recarga en vivo.                            |
| `pnpm build`        | Compila el sitio a `dist/`.                                            |
| `pnpm preview`      | Sirve `dist/` en `http://127.0.0.1:4321/`.                             |
| `pnpm serve`        | Sirve `dist/` o `web/` con `scripts/serve.mjs` (puerto 4173).          |
| `pnpm test`         | Ejecuta las **40 pruebas unitarias** de la lógica con Vitest.          |
| `pnpm check`        | Tipado de TypeScript y diagnóstico de Astro (`astro check`).           |
| `pnpm resultados`   | Exporta los casos de prueba a `docs/resultados.json` y CSV.            |
| `pnpm doc`          | Regenera resultados **y** el PDF de entrega (`docs/EquipoX_…pdf`).      |
| `pnpm empaquetar`   | Crea la carpeta y el ZIP de entrega en `entrega/`.                    |

> La QA automatizada (`node scripts/qa.mjs`) requiere el sitio compilado y servido
> (`pnpm preview`) y una copia de Chrome/Chromium; produce las capturas de `docs/capturas/`.

---

## Estructura del proyecto

```
calculadora-ip/
├── src/
│   ├── lib/                  # Lógica pura, sin DOM (probada con Vitest)
│   │   ├── ip.ts             #   parseo/validación IPv4, análisis CIDR completo
│   │   ├── subnetting.ts     #   prefijo por hosts, división fija, bloques libres
│   │   └── vlsm.ts           #   algoritmo VLSM (orden mayor→menor + asignación)
│   ├── pages/                # index (selector), cidr, vlsm, guia
│   ├── components/           # Header, Footer, BinaryStrip
│   └── layouts/Base.astro
├── tests/                    # 40 pruebas unitarias (ip, subnetting, vlsm)
├── scripts/
│   ├── equipo.json           # datos del equipo (nombres, matrículas, profesor…)
│   ├── export-results.ts     # casos de prueba → docs/resultados.json + CSV
│   ├── build-doc.mjs         # genera el PDF de entrega con Chrome headless
│   ├── qa.mjs                # QA automatizada del sitio con Playwright
│   ├── serve.mjs             # servidor estático sin dependencias (servidor.mjs)
│   └── empaquetar.mjs        # arma el ZIP de entrega
├── docs/                     # PDF, resultados, guion de video, explicación, capturas
├── iniciar.bat               # arranque con doble clic (Windows)
└── dist/                     # sitio compilado (salida de `pnpm build`)
```

En el ZIP de entrega, `dist/` se copia como `web/`, `scripts/serve.mjs` como `servidor.mjs`
y todo el código fuente queda en `codigo-fuente/`.

---

## Calidad

- **40 pruebas unitarias** (Vitest) sobre la lógica de `src/lib/`: parseo y validaciones,
  análisis CIDR, subnetting y VLSM. `pnpm test`.
- **QA automatizada en navegador** (Playwright): 46 verificaciones sobre las páginas
  compiladas — casos felices, errores de validación, mensajes de espacio insuficiente y
  consistencia de la tabla VLSM — con **0 errores de consola**. Genera las capturas de
  `docs/capturas/` que se usan como evidencia en el PDF.
- **Tipado estricto de TypeScript** (`astro check` sin errores).

## Entregables

| Archivo | Ubicación |
| --- | --- |
| Documento del proyecto | `docs/EquipoX_CalculadoraIP.pdf` (se regenera con `pnpm doc`) |
| ZIP de entrega | `entrega/EquipoX_CalculadoraIP.zip` (se regenera con `pnpm empaquetar`) |
| Guion del video | `docs/Guion_Video.md` |
| Explicación del proyecto | `docs/EXPLICACION_PROYECTO.md` |
| Resultados de pruebas | `docs/resultados.json`, `docs/resultados-vlsm.csv` |

> **Antes de entregar**: edita `scripts/equipo.json` con los nombres, matrículas, correos,
> profesor, grupo y repositorio reales. El nombre del PDF, del ZIP y del video
> (`EquipoX_CalculadoraIP.mp4`) se toma del campo `equipo`. Después ejecuta
> `pnpm doc && pnpm empaquetar` para regenerar todo con los datos finales.

## Créditos y atribuciones

Proyecto escolar del equipo **Equipo X** (datos completos en `scripts/equipo.json` y en la
portada del PDF). Construido con:

- [Astro](https://astro.build) — generador del sitio estático.
- [Tailwind CSS](https://tailwindcss.com) — estilos.
- [TypeScript](https://www.typescriptlang.org) — tipado de la lógica.
- [Vitest](https://vitest.dev) — pruebas unitarias.
- [Playwright](https://playwright.dev) (playwright-core) — QA automatizada.
- Tipografías Inter, Space Grotesk y JetBrains Mono ([Fontsource](https://fontsource.org)).

Ideas y fórmulas basadas en el temario de la materia (direccionamiento IPv4, CIDR, VLSM)
y en los RFC 950 (subnetting), 1918 (rangos privados) y 3021 (/31 punto a punto).
