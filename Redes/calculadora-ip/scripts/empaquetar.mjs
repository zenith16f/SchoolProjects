/**
 * Empaqueta la entrega final del Proyecto 2 en un ZIP.
 *
 *   pnpm empaquetar    # genera entrega/EquipoX_CalculadoraIP.zip
 *
 * El nombre del ZIP se toma del campo `equipo` de scripts/equipo.json
 * (igual que el PDF), y la estructura interna queda así:
 *
 *   EquipoX_CalculadoraIP/
 *   ├── EquipoX_CalculadoraIP.pdf   ← documento de entrega
 *   ├── README.md                   ← cómo ejecutar y regenerar todo
 *   ├── iniciar.bat                 ← arranque con doble clic (Windows)
 *   ├── servidor.mjs                ← servidor estático sin dependencias
 *   ├── web/                        ← sitio compilado (copia de dist/)
 *   ├── codigo-fuente/              ← src, tests, scripts, configs, lockfile
 *   └── docs/                       ← guion, explicación, resultados, capturas
 *
 * NOTA: node_modules NO se incluye. Para reconstruir el sitio desde el
 * código fuente basta `pnpm install && pnpm build` (ver codigo-fuente/LEEME.txt).
 */
import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const config = JSON.parse(
  await readFile(path.join(ROOT, "scripts", "equipo.json"), "utf8"),
);
const equipoSlug = String(config.equipo).replace(/\s+/g, "");

const DELIVERY = path.join(ROOT, "entrega");
const STAGE = path.join(DELIVERY, `${equipoSlug}_CalculadoraIP`);
const ZIP = path.join(DELIVERY, `${equipoSlug}_CalculadoraIP.zip`);

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                  */
/* -------------------------------------------------------------------------- */

async function assertExists(relative, hint) {
  const target = path.join(ROOT, relative);
  try {
    const info = await stat(target);
    if (!info.isFile() && !info.isDirectory()) {
      throw new Error("no es archivo ni carpeta");
    }
    return target;
  } catch {
    console.error(`[empaquetar] Falta "${relative}". ${hint}`);
    process.exit(1);
  }
}

async function copyItem(from, to) {
  await mkdir(path.dirname(to), { recursive: true });
  await cp(from, to, { recursive: true, force: true });
}

function runZip(folderName) {
  // bsdtar (incluido en Windows 10+) crea ZIP válidos con rutas con "/".
  // -a infiere el formato por la extensión del archivo destino.
  const result = spawnSync(
    "tar",
    ["-a", "-c", "-f", ZIP, folderName],
    { cwd: DELIVERY, stdio: "inherit" },
  );

  if (result.status !== 0) {
    // Respaldo: PowerShell si tar no está disponible.
    console.log("[empaquetar] tar falló; usando Compress-Archive de PowerShell…");
    const ps = spawnSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `Compress-Archive -Path "${path.join(DELIVERY, folderName)}" -DestinationPath "${ZIP}" -Force`,
      ],
      { stdio: "inherit" },
    );
    if (ps.status !== 0) {
      console.error("[empaquetar] No se pudo crear el ZIP.");
      process.exit(1);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Verificaciones previas                                                      */
/* -------------------------------------------------------------------------- */

await assertExists("dist/index.html", "Ejecuta `pnpm build` antes de empaquetar.");
await assertExists(
  `docs/${equipoSlug}_CalculadoraIP.pdf`,
  "Ejecuta `pnpm doc` para generar el PDF.",
);
await assertExists("README.md", "Falta el README de la raíz del proyecto.");
await assertExists("docs/Guion_Video.md", "Falta docs/Guion_Video.md.");
await assertExists("docs/EXPLICACION_PROYECTO.md", "Falta docs/EXPLICACION_PROYECTO.md.");
await assertExists("docs/resultados.json", "Ejecuta `pnpm resultados`.");
await assertExists("docs/resultados-vlsm.csv", "Ejecuta `pnpm resultados`.");
await assertExists("docs/capturas", "Ejecuta `node scripts/qa.mjs` para generar capturas.");

/* -------------------------------------------------------------------------- */
/* Preparar carpeta de salida                                                  */
/* -------------------------------------------------------------------------- */

await rm(DELIVERY, { recursive: true, force: true });
await mkdir(STAGE, { recursive: true });

/* -------------------------------------------------------------------------- */
/* 1. Raíz de la entrega                                                        */
/* -------------------------------------------------------------------------- */

await copyItem(
  path.join(ROOT, "docs", `${equipoSlug}_CalculadoraIP.pdf`),
  path.join(STAGE, `${equipoSlug}_CalculadoraIP.pdf`),
);
await copyItem(path.join(ROOT, "README.md"), path.join(STAGE, "README.md"));
await copyItem(path.join(ROOT, "iniciar.bat"), path.join(STAGE, "iniciar.bat"));
await copyItem(
  path.join(ROOT, "scripts", "serve.mjs"),
  path.join(STAGE, "servidor.mjs"),
);

/* -------------------------------------------------------------------------- */
/* 2. Sitio compilado (web/)                                                   */
/* -------------------------------------------------------------------------- */

await copyItem(path.join(ROOT, "dist"), path.join(STAGE, "web"));

/* -------------------------------------------------------------------------- */
/* 3. Código fuente                                                            */
/* -------------------------------------------------------------------------- */

const SOURCE_FOLDERS = ["src", "tests", "scripts", "public"];
const SOURCE_FILES = [
  "package.json",
  "astro.config.mjs",
  "postcss.config.mjs",
  "tsconfig.json",
  "vitest.config.ts",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
];

for (const folder of SOURCE_FOLDERS) {
  await copyItem(
    path.join(ROOT, folder),
    path.join(STAGE, "codigo-fuente", folder),
  );
}

for (const file of SOURCE_FILES) {
  const source = await assertExists(file, "Archivo de configuración faltante.");
  await copyItem(source, path.join(STAGE, "codigo-fuente", file));
}

await copyItem(
  path.join(ROOT, ".gitignore"),
  path.join(STAGE, "codigo-fuente", ".gitignore"),
);

await writeFile(
  path.join(STAGE, "codigo-fuente", "LEEME.txt"),
  `Código fuente de la Calculadora IP (Proyecto 2 · Redes de Computadoras).

Este carpeta contiene el proyecto completo SIN node_modules (las dependencias
se descargan desde el registro de npm al instalar).

Requisitos:
  - Node.js 22 o superior  (https://nodejs.org)
  - pnpm 10 o superior      (npm install -g pnpm)

Pasos para reconstruir el sitio:

  1) pnpm install          descarga dependencias
  2) pnpm test             ejecuta las 40 pruebas unitarias (Vitest)
  3) pnpm build            compila el sitio a dist/
  4) pnpm preview          sirve dist/ en http://127.0.0.1:4321/

El resultado de \`pnpm build\` es idéntico al contenido de ../web del ZIP.
La lógica de cálculo vive en src/lib/ (ip.ts, subnetting.ts, vlsm.ts) y no
depende del navegador: se puede probar y reutilizar de forma independiente.
`,
  "utf8",
);

/* -------------------------------------------------------------------------- */
/* 4. Documentación                                                            */
/* -------------------------------------------------------------------------- */

const DOCS_ITEMS = [
  "docs/Guion_Video.md",
  "docs/EXPLICACION_PROYECTO.md",
  "docs/documento.html",
  "docs/resultados.json",
  "docs/resultados-vlsm.csv",
];

for (const item of DOCS_ITEMS) {
  const source = await assertExists(item, "Documento de entrega faltante.");
  await copyItem(source, path.join(STAGE, item));
}

await copyItem(
  path.join(ROOT, "docs", "capturas"),
  path.join(STAGE, "docs", "capturas"),
);

/* -------------------------------------------------------------------------- */
/* 5. Comprimir                                                                */
/* -------------------------------------------------------------------------- */

runZip(path.basename(STAGE));

/* -------------------------------------------------------------------------- */
/* Resumen                                                                     */
/* -------------------------------------------------------------------------- */

const listing = spawnSync("tar", ["-tf", ZIP], { cwd: DELIVERY, encoding: "utf8" });
const entries = listing.status === 0
  ? listing.stdout.split("\n").filter(Boolean)
  : [];

const zipInfo = await stat(ZIP);
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

console.log("");
console.log(`Entrega creada: ${path.relative(ROOT, ZIP)} (${mb(zipInfo.size)})`);
console.log(`Carpeta:         ${path.relative(ROOT, STAGE)}`);
console.log(`Entradas en ZIP: ${entries.length}`);
console.log("");
console.log("Contenido de primer nivel:");
for (const entry of entries) {
  const depth = entry.split("/").length;
  if (depth <= 2 && !entry.endsWith("/")) {
    console.log(`  ${entry}`);
  }
}
console.log("");
console.log("Siguiente paso: entrega el ZIP y graba el video siguiendo docs/Guion_Video.md.");
