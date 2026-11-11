/**
 * Servidor estático mínimo para el sitio compilado (dist/) o para la carpeta
 * web/ del ZIP de entrega. No tiene dependencias: solo módulos de Node.
 *
 * Uso:
 *   node scripts/serve.mjs [carpeta] [puerto]
 *
 * Si no se indica carpeta, se busca ./dist y luego ./web.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const argFolder = process.argv[2];
const argPort = Number(process.argv[3] ?? process.env.PORT ?? 4173);

const CANDIDATES = [
  argFolder,
  "dist",
  "web",
  join("calculadora-ip", "dist"),
].filter(Boolean);

async function pickRoot() {
  for (const candidate of CANDIDATES) {
    const folder = resolve(process.cwd(), candidate);
    try {
      const info = await stat(folder);
      if (info.isDirectory()) return folder;
    } catch {
      // El candidato no existe; se prueba el siguiente.
    }
  }
  return null;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

const root = await pickRoot();

if (!root) {
  console.error(
    "No se encontró la carpeta del sitio. Ejecuta `pnpm build` o pasa la carpeta como argumento.",
  );
  process.exit(1);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  let pathname = decodeURIComponent(url.pathname);

  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  const target = normalize(join(root, pathname));
  if (!target.startsWith(root)) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("403");
    return;
  }

  const attempts = [target, join(target, "index.html")];

  for (const candidate of attempts) {
    try {
      const info = await stat(candidate);
      if (!info.isFile()) continue;

      const body = await readFile(candidate);
      response.writeHead(200, {
        "content-type": MIME[extname(candidate).toLowerCase()] ?? "application/octet-stream",
        "cache-control": "no-store",
        "content-length": body.length,
      });
      response.end(body);
      return;
    } catch {
      // Se prueba el siguiente candidato.
    }
  }

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end(`404 · No se encontró ${pathname}`);
});

server.listen(argPort, "127.0.0.1", () => {
  console.log(`Sirviendo ${root}`);
  console.log(`Calculadora IP disponible en http://127.0.0.1:${argPort}/`);
  console.log("Presiona Ctrl+C para detener el servidor.");
});
