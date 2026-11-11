/**
 * QA automatizado de la interfaz con Playwright (Chrome instalado en el equipo).
 * No forma parte del sitio: sirve para verificar los cálculos y capturar
 * pantallas para el README y el PDF.
 *
 * Uso:
 *   node scripts/qa.mjs
 * Requiere el sitio servido en http://127.0.0.1:4321 (pnpm preview).
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.QA_BASE ?? "http://127.0.0.1:4321";
const CHROME =
  process.env.QA_CHROME ??
  "C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe";
const OUT = path.resolve("docs", "capturas");

const failures = [];
let checks = 0;

function check(label, actual, expected) {
  checks += 1;
  const ok = String(actual).trim() === String(expected).trim();
  if (!ok) {
    failures.push(`${label}: esperado «${expected}», obtenido «${actual}»`);
  }
  console.log(`${ok ? "OK  " : "FAIL"} ${label} → ${actual}`);
}

async function text(page, selector) {
  return (await page.locator(selector).first().innerText()).trim();
}

async function field(page, name) {
  return text(page, `[data-field="${name}"]`);
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1.5,
  locale: "es-MX",
});
const page = await context.newPage();
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

await mkdir(OUT, { recursive: true });

/* ---------------------------------- Home --------------------------------- */
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
check(
  "home title",
  await page.title(),
  "Calculadora IP — CIDR y VLSM · Calculadora IP",
);
check("home opción CIDR visible", await page.locator('[data-calculator="cidr"]').isVisible(), true);
check("home opción VLSM visible", await page.locator('[data-calculator="vlsm"]').isVisible(), true);
check("home opción CIDR apunta a /cidr/", await page.locator('[data-calculator="cidr"]').getAttribute("href"), "/cidr/");
check("home opción VLSM apunta a /vlsm/", await page.locator('[data-calculator="vlsm"]').getAttribute("href"), "/vlsm/");
await page.screenshot({ path: path.join(OUT, "01-inicio.png"), fullPage: true });
await page.screenshot({ path: path.join(OUT, "01-inicio-hero.png") });

/* ---------------------------------- CIDR --------------------------------- */
await page.goto(`${BASE}/cidr/`, { waitUntil: "networkidle" });
await page.waitForFunction(() => {
  const node = document.querySelector('[data-field="network"]');
  return node && node.textContent !== "—";
});
check("CIDR red /24", await field(page, "network"), "192.168.10.0");
check("CIDR broadcast /24", await field(page, "broadcast"), "192.168.10.255");
check("CIDR rango /24", await field(page, "range"), "192.168.10.1 – 192.168.10.254");
check("CIDR hosts /24", await field(page, "hosts"), "254");
check("CIDR máscara /24", await field(page, "mask"), "255.255.255.0");
check("CIDR wildcard /24", await field(page, "wildcard"), "0.0.0.255");
check("CIDR clase /24", await field(page, "class"), "C — Clase C");
check("CIDR ámbito /24", await field(page, "scope"), "PRIVADA");
check("CIDR subredes /24", await page.locator("#subnet-body tr").count(), 4);
await page.screenshot({ path: path.join(OUT, "02-cidr.png"), fullPage: true });
await page.locator("#cidr-form").screenshot({
  path: path.join(OUT, "02-cidr-form.png"),
});
await page.locator('section[aria-live="polite"]').screenshot({
  path: path.join(OUT, "02-cidr-resultados.png"),
});

// Dirección con host distinto de cero y prefijo /26.
await page.fill("#cidr-ip", "172.16.5.130/26");
await page.locator("#cidr-ip").press("Enter");
await page.waitForTimeout(150);
check("CIDR red /26", await field(page, "network"), "172.16.5.128");
check("CIDR broadcast /26", await field(page, "broadcast"), "172.16.5.191");
check("CIDR rango /26", await field(page, "range"), "172.16.5.129 – 172.16.5.190");
check("CIDR hosts /26", await field(page, "hosts"), "62");
check("CIDR prefijo absorbido", await page.inputValue("#cidr-prefix"), "26");

// Modo máscara decimal: /23.
await page.click('[data-mode="mask"]');
await page.fill("#cidr-mask", "255.255.254.0");
await page.waitForTimeout(150);
check("CIDR prefijo desde máscara", await field(page, "prefix"), "/23");
check("CIDR red /23", await field(page, "network"), "172.16.4.0");
check("CIDR hosts /23", await field(page, "hosts"), "510");

// Máscara inválida.
await page.fill("#cidr-mask", "255.0.255.0");
await page.waitForTimeout(100);
check(
  "CIDR error máscara",
  await page.locator("#cidr-mask-error").isVisible(),
  true,
);

// Explorador por hosts sobre una /24 limpia.
await page.click('[data-mode="prefix"]');
await page.fill("#cidr-ip", "192.168.10.0");
await page.fill("#cidr-prefix", "24");
await page.waitForTimeout(150);
await page.click('[data-tab="hosts"]');
await page.fill("#subnet-hosts", "50");
await page.waitForTimeout(150);
check("CIDR subredes por 50 hosts", await page.locator("#subnet-body tr").count(), 4);
const firstSubnet = await page.locator("#subnet-body tr").first().innerText();
check("CIDR primera subred /26", firstSubnet.includes("/26"), true);

// Error de IP.
await page.fill("#cidr-ip", "300.1.1.1");
await page.waitForTimeout(100);
check("CIDR error IP", await page.locator("#cidr-ip-error").isVisible(), true);
await page.fill("#cidr-ip", "192.168.10.0");
await page.waitForTimeout(100);

/* ---------------------------------- VLSM --------------------------------- */
await page.goto(`${BASE}/vlsm/`, { waitUntil: "networkidle" });
await page.waitForFunction(() => {
  const node = document.querySelector("#vlsm-stat-count");
  return node && node.textContent === "4";
});
check("VLSM subredes PDF", await text(page, "#vlsm-stat-count"), "4");
check("VLSM asignadas PDF", await text(page, "#vlsm-stat-assigned"), "240");
check("VLSM libres PDF", await text(page, "#vlsm-stat-free"), "16");
check("VLSM eficiencia PDF", await text(page, "#vlsm-stat-efficiency"), "90.6 %");
check("VLSM útiles PDF", await text(page, "#vlsm-usable"), "232");
check("VLSM reservadas PDF", await text(page, "#vlsm-reserved"), "8");
check("VLSM holgura PDF", await text(page, "#vlsm-slack"), "47");

const rows = await page.locator("#vlsm-table-body tr").allInnerTexts();
check("VLSM fila A", rows[0].includes("192.168.0.0/25"), true);
check("VLSM fila B", rows[1].includes("192.168.0.128/26"), true);
check("VLSM fila C", rows[2].includes("192.168.0.192/27"), true);
check("VLSM fila D", rows[3].includes("192.168.0.224/28"), true);
check(
  "VLSM bloque libre",
  (await text(page, "#vlsm-free-list")).includes("192.168.0.240/28"),
  true,
);
await page.screenshot({ path: path.join(OUT, "03-vlsm.png"), fullPage: true });
await page.locator("#vlsm-map").locator("..").screenshot({
  path: path.join(OUT, "03-vlsm-mapa.png"),
});
await page.locator("#vlsm-table-body").locator("..").locator("..").screenshot({
  path: path.join(OUT, "03-vlsm-tabla.png"),
});

// Preset campus.
await page.click("#vlsm-preset-campus");
await page.waitForTimeout(200);
check("VLSM subredes campus", await text(page, "#vlsm-stat-count"), "5");
check("VLSM base campus", await text(page, "#vlsm-base-chip"), "10.0.0.0/16");
await page.screenshot({ path: path.join(OUT, "04-vlsm-campus.png"), fullPage: true });

// Error de espacio insuficiente.
await page.click("#vlsm-preset-pdf");
await page.waitForTimeout(100);
await page.click("#vlsm-clear");
await page.waitForTimeout(100);
check("VLSM estado vacío", await page.locator("#vlsm-empty").isVisible(), true);

await page.click("#vlsm-add");
await page.waitForTimeout(100);
await page.locator("#vlsm-rows [data-row-id]").nth(0).locator('[data-role="name"]').fill("A");
await page.locator("#vlsm-rows [data-row-id]").nth(0).locator('[data-role="hosts"]').fill("200");
await page.click("#vlsm-add");
await page.waitForTimeout(100);
await page.locator("#vlsm-rows [data-row-id]").nth(1).locator('[data-role="name"]').fill("B");
await page.locator("#vlsm-rows [data-row-id]").nth(1).locator('[data-role="hosts"]').fill("100");
await page.waitForTimeout(150);
check("VLSM error visible", await page.locator("#vlsm-error").isVisible(), true);
const errorText = await text(page, "#vlsm-error-message");
check("VLSM error menciona /23", errorText.includes("/23"), true);
await page.screenshot({ path: path.join(OUT, "05-vlsm-error.png"), fullPage: true });
await page.locator("#vlsm-error").screenshot({
  path: path.join(OUT, "05-vlsm-error-banner.png"),
});

// Validación de hosts.
await page.fill("#vlsm-base-ip", "10.0.0.0");
await page.fill("#vlsm-prefix", "24");
await page.waitForTimeout(100);
check("VLSM base normalizada", await text(page, "#vlsm-base-preview"), "10.0.0.0/24");

/* ---------------------------------- Guía --------------------------------- */
const guide = await page.goto(`${BASE}/guia/`, { waitUntil: "networkidle" });
check("guía status", guide?.status(), 200);
if (guide?.status() === 200) {
  await page.screenshot({ path: path.join(OUT, "06-guia.png"), fullPage: true });
}

/* -------------------------------- Resumen -------------------------------- */
check("errores de consola", consoleErrors.length === 0 ? "0" : consoleErrors.join(" | "), "0");

await browser.close();

console.log(`\n${checks - failures.length}/${checks} comprobaciones correctas.`);
if (failures.length > 0) {
  console.error("\nFallos:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
