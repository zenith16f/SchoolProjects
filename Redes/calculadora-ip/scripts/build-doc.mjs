/**
 * Genera el documento PDF del proyecto con Chrome (Playwright) a partir de
 * HTML/CSS de impresión. No requiere LaTeX ni reportlab.
 *
 * Uso:
 *   pnpm resultados   # actualiza docs/resultados.json
 *   pnpm doc          # genera docs/EquipoX_CalculadoraIP.pdf
 *
 * Los datos del equipo se editan en scripts/equipo.json.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import sharp from "sharp";

const ROOT = process.cwd();
const CHROME =
  process.env.DOC_CHROME ??
  "C:\\Program Files\\Google\\Chrome Dev\\Application\\chrome.exe";

const config = JSON.parse(
  await readFile(path.join(ROOT, "scripts", "equipo.json"), "utf8"),
);
const data = JSON.parse(
  await readFile(path.join(ROOT, "docs", "resultados.json"), "utf8"),
);

const equipoSlug = String(config.equipo).replace(/\s+/g, "");
const outPdf = path.join(ROOT, "docs", `${equipoSlug}_CalculadoraIP.pdf`);
const outHtml = path.join(ROOT, "docs", "documento.html");

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                  */
/* -------------------------------------------------------------------------- */

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const n = (value) => Number(value).toLocaleString("es-MX");

async function image(name, width = 1400) {
  const file = path.join(ROOT, "docs", "capturas", name);
  const buffer = await sharp(file)
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

const shots = {
  hero: await image("01-inicio-hero.png", 1400),
  cidrForm: await image("02-cidr-form.png", 1300),
  cidrResults: await image("02-cidr-resultados.png", 1400),
  vlsmMap: await image("03-vlsm-mapa.png", 1200),
  vlsmTable: await image("03-vlsm-tabla.png", 1200),
  error: await image("05-vlsm-error-banner.png", 1000),
};

/* Resaltado de código: tokenizador sencillo para TS/JS. */
const KEYWORDS = new Set(
  (
    "import export from const let var function return if else for while do " +
    "switch case break continue new throw try catch finally class extends " +
    "interface type enum implements public private readonly static async " +
    "await of in typeof instanceof as void null undefined true false this " +
    "number string boolean Array Promise Record Set Map"
  ).split(" "),
);

function span(kind, text) {
  return `<span class="${kind}">${esc(text)}</span>`;
}

function highlightLine(line, state) {
  let out = "";
  let i = 0;

  while (i < line.length) {
    if (state.block) {
      const end = line.indexOf("*/", i);
      if (end === -1) {
        out += span("c", line.slice(i));
        i = line.length;
      } else {
        out += span("c", line.slice(i, end + 2));
        i = end + 2;
        state.block = false;
      }
      continue;
    }

    const char = line[i];
    const next = line[i + 1];

    if (char === "/" && next === "/") {
      out += span("c", line.slice(i));
      break;
    }
    if (char === "/" && next === "*") {
      const end = line.indexOf("*/", i + 2);
      if (end === -1) {
        out += span("c", line.slice(i));
        state.block = true;
        i = line.length;
      } else {
        out += span("c", line.slice(i, end + 2));
        i = end + 2;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      let j = i + 1;
      while (j < line.length) {
        if (line[j] === "\\") {
          j += 2;
          continue;
        }
        if (line[j] === char) {
          j += 1;
          break;
        }
        j += 1;
      }
      out += span("s", line.slice(i, j));
      i = j;
      continue;
    }
    if (/[0-9]/.test(char)) {
      let j = i + 1;
      while (j < line.length && /[0-9a-fA-Fx._]/.test(line[j])) j += 1;
      out += span("n", line.slice(i, j));
      i = j;
      continue;
    }
    if (/[A-Za-z_$]/.test(char)) {
      let j = i + 1;
      while (j < line.length && /[A-Za-z0-9_$]/.test(line[j])) j += 1;
      const word = line.slice(i, j);
      out += KEYWORDS.has(word) ? span("k", word) : esc(word);
      i = j;
      continue;
    }
    out += esc(char);
    i += 1;
  }

  return out;
}

async function excerpt(file, ranges) {
  const lines = (await readFile(path.join(ROOT, file), "utf8")).split(/\r?\n/);
  const state = { block: false };
  const out = [];

  ranges.forEach(([start, end], rangeIndex) => {
    if (rangeIndex > 0) {
      out.push(`<div class="codeline"><span class="ln">…</span><span class="ct"> </span></div>`);
    }
    for (let index = start; index <= end; index += 1) {
      const text = lines[index - 1] ?? "";
      out.push(
        `<div class="codeline"><span class="ln">${index}</span><span class="ct">${highlightLine(text, state)}</span></div>`,
      );
    }
  });

  return out.join("");
}

async function codeBlock(title, file, ranges) {
  return `<div class="code-head"><span>${esc(title)}</span><span class="file">${esc(file)}</span></div>
    <div class="code">${await excerpt(file, ranges)}</div>`;
}

function table(headers, rows, className = "") {
  return `<table class="tbl ${className}">
    <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
    <tbody>${rows
      .map(
        (row) =>
          `<tr>${row
            .map((cell) => `<td>${cell === null ? "—" : cell}</td>`)
            .join("")}</tr>`,
      )
      .join("")}</tbody>
  </table>`;
}

const cidr = data.cidrCases;
const vlsm = data.vlsmPdf;
const campus = data.vlsmCampus;

const cidrRows = cidr.map((item) => [
  `<span class="mono">${esc(item.input)}</span>`,
  `<span class="mono">${esc(item.analysis.networkText)}/${item.analysis.prefix}</span>`,
  `<span class="mono">${esc(item.analysis.firstHostText ?? "—")} – ${esc(item.analysis.lastHostText ?? "—")}</span>`,
  `<span class="mono">${esc(item.analysis.broadcastText)}</span>`,
  `<span class="mono">${n(item.analysis.usableHosts)}</span>`,
  `<span class="mono">${esc(item.analysis.maskText)}</span>`,
]);

const vlsmRows = vlsm.subnets.map((subnet, index) => [
  `<span class="mono">${index + 1}</span>`,
  `<strong>${esc(subnet.name)}</strong>`,
  `<span class="mono">${subnet.requestedHosts}</span>`,
  `<span class="mono">${esc(subnet.cidr)}</span>`,
  `<span class="mono">${esc(subnet.maskText)}</span>`,
  `<span class="mono">${esc(subnet.firstHostText)} – ${esc(subnet.lastHostText)}</span>`,
  `<span class="mono">${esc(subnet.broadcastText)}</span>`,
  `<span class="mono">${subnet.usableHosts}</span>`,
  `<span class="mono">${subnet.waste}</span>`,
]);

const campusRows = campus.subnets.map((subnet, index) => [
  `<span class="mono">${index + 1}</span>`,
  `<strong>${esc(subnet.name)}</strong>`,
  `<span class="mono">${subnet.requestedHosts}</span>`,
  `<span class="mono">${esc(subnet.cidr)}</span>`,
  `<span class="mono">${esc(subnet.maskText)}</span>`,
  `<span class="mono">${subnet.usableHosts}</span>`,
  `<span class="mono">${subnet.waste}</span>`,
]);

const prefixRows = data.prefixes.map((row) => [
  `<span class="mono accent">/${row.prefix}</span>`,
  `<span class="mono">${esc(row.mask)}</span>`,
  `<span class="mono">${esc(row.wildcard)}</span>`,
  `<span class="mono">${n(row.total)}</span>`,
  `<span class="mono">${n(row.usable)}</span>`,
]);

const teamRows = config.integrantes.map((member, index) => [
  `<span class="mono">${index + 1}</span>`,
  `<strong>${esc(member.nombre)}</strong>`,
  `<span class="mono">${esc(member.matricula)}</span>`,
  `<span class="tiny">${esc(member.correo)}</span>`,
  `<span class="tiny">${esc(member.rol)}</span>`,
]);

const teamCards = config.integrantes
  .map(
    (member, index) => `<div class="card avoid">
      <div class="card-kicker">Integrante ${index + 1}</div>
      <h4>${esc(member.nombre)}</h4>
      <p class="tiny muted">${esc(member.matricula)} · ${esc(member.correo)}</p>
      <p class="small"><strong>Rol:</strong> ${esc(member.rol)}</p>
    </div>`,
  )
  .join("");

/* -------------------------------------------------------------------------- */
/* Documento                                                                   */
/* -------------------------------------------------------------------------- */

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${esc(config.equipo)} · Calculadora IP — CIDR y VLSM</title>
<style>
  :root {
    --bg: #171b1f;
    --surface: #1d2227;
    --surface-2: #232930;
    --line: rgba(255,255,255,0.10);
    --text: #f4f0e4;
    --muted: #a3adb8;
    --dim: #7b8794;
    --blue: #6c9fe8;
    --green: #6cc28c;
    --red: #e57a70;
    --bone: #fbf9f2;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--text);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: "Segoe UI", "Inter", Arial, sans-serif;
    font-size: 10.2pt;
    line-height: 1.55;
  }
  h1, h2, h3, h4 { margin: 0; line-height: 1.2; }
  h2 {
    font-size: 20pt;
    letter-spacing: -0.02em;
    margin: 0 0 4mm;
    padding-bottom: 3mm;
    border-bottom: 1px solid var(--line);
    break-after: avoid;
  }
  h2 .num {
    display: inline-block;
    min-width: 13mm;
    color: var(--blue);
    font-size: 14pt;
    font-weight: 700;
  }
  h3 {
    font-size: 12.6pt;
    margin: 6mm 0 2mm;
    color: var(--bone);
    break-after: avoid;
  }
  h4 { font-size: 10.6pt; color: var(--bone); }
  p { margin: 0 0 2.6mm; }
  ul, ol { margin: 0 0 3mm; padding-left: 5mm; }
  li { margin-bottom: 1.2mm; }
  strong { color: var(--bone); }
  .muted { color: var(--muted); }
  .dim { color: var(--dim); }
  .tiny { font-size: 7.6pt; }
  .small { font-size: 8.8pt; }
  .mono { font-family: Consolas, "Cascadia Mono", monospace; font-size: 8.9pt; }
  .accent { color: var(--blue); }
  .green { color: var(--green); }
  .red { color: var(--red); }
  .section { break-before: page; }
  .lead { font-size: 11.2pt; color: #d3cab5; }
  .eyebrow {
    font-size: 7.6pt;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--dim);
    margin-bottom: 2mm;
  }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm; }
  .card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 3mm;
    padding: 4mm;
  }
  .card h4 { margin-bottom: 1mm; }
  .card-kicker {
    font-size: 7.2pt;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--dim);
    margin-bottom: 1.5mm;
  }
  .callout {
    background: rgba(108,159,232,0.07);
    border: 1px solid rgba(108,159,232,0.22);
    border-left: 1.2mm solid var(--blue);
    border-radius: 2mm;
    padding: 3.5mm 4mm;
    margin: 3mm 0 4mm;
    break-inside: avoid;
  }
  .callout.green {
    background: rgba(108,194,140,0.06);
    border-color: rgba(108,194,140,0.22);
    border-left-color: var(--green);
  }
  .callout.red {
    background: rgba(229,122,112,0.07);
    border-color: rgba(229,122,112,0.24);
    border-left-color: var(--red);
  }
  .callout p:last-child { margin-bottom: 0; }
  .tag {
    display: inline-block;
    padding: 0.6mm 2mm;
    border-radius: 99px;
    background: rgba(255,255,255,0.06);
    color: var(--muted);
    font-size: 7.2pt;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .tag.blue { background: rgba(108,159,232,0.16); color: #93baf0; }
  .tag.green { background: rgba(108,194,140,0.15); color: #93d6ac; }
  .tag.red { background: rgba(229,122,112,0.15); color: #f0a098; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin: 4mm 0; }
  .kpi {
    background: var(--surface);
    border: 1px solid var(--line);
    border-top: 2px solid var(--blue);
    border-radius: 2.5mm;
    padding: 3.5mm;
  }
  .kpi:nth-child(2) { border-top-color: var(--green); }
  .kpi:nth-child(3) { border-top-color: var(--red); }
  .kpi:nth-child(4) { border-top-color: #e7e1d1; }
  .kpi .value { font-size: 20pt; font-weight: 700; color: var(--bone); line-height: 1; }
  .kpi .label { font-size: 7.4pt; color: var(--dim); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2mm; }
  .tbl {
    width: 100%;
    border-collapse: collapse;
    margin: 2mm 0 5mm;
    font-size: 8.3pt;
    break-inside: auto;
  }
  .tbl thead { display: table-header-group; }
  .tbl th {
    background: var(--surface-2);
    color: #d3cab5;
    text-align: left;
    font-size: 7.1pt;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    padding: 2mm 2.2mm;
    border-bottom: 1px solid var(--line);
  }
  .tbl td {
    padding: 1.9mm 2.2mm;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    vertical-align: top;
  }
  .tbl tr:nth-child(even) td { background: rgba(255,255,255,0.015); }
  .tbl.compact td, .tbl.compact th { padding: 1.4mm 1.8mm; }
  .shot {
    display: block;
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 2.5mm;
    margin: 2mm 0 2mm;
    break-inside: avoid;
  }
  .shot.narrow { width: 82%; margin-left: auto; margin-right: auto; }
  .caption {
    font-size: 7.6pt;
    color: var(--dim);
    text-align: center;
    margin: -0.5mm 0 4mm;
  }
  .code-head {
    display: flex;
    justify-content: space-between;
    gap: 3mm;
    background: #20262c;
    border: 1px solid var(--line);
    border-bottom: 0;
    border-radius: 2.5mm 2.5mm 0 0;
    padding: 2.2mm 3mm;
    font-size: 8.2pt;
    font-weight: 600;
    color: var(--bone);
    break-after: avoid;
  }
  .code-head .file {
    font-family: Consolas, monospace;
    font-size: 7.2pt;
    font-weight: 400;
    color: var(--dim);
  }
  .code {
    background: #101418;
    border: 1px solid var(--line);
    border-radius: 0 0 2.5mm 2.5mm;
    padding: 2.5mm 0;
    margin: 0 0 4mm;
    font-family: Consolas, "Cascadia Mono", monospace;
    font-size: 6.9pt;
    line-height: 1.42;
    overflow: hidden;
  }
  .codeline { display: flex; }
  .codeline .ln {
    flex: 0 0 9mm;
    text-align: right;
    padding-right: 2.5mm;
    color: #4d5862;
    user-select: none;
  }
  .codeline .ct {
    flex: 1;
    white-space: pre-wrap;
    word-break: break-word;
    padding-right: 3mm;
    color: #d9d4c7;
  }
  .k { color: #93baf0; }
  .s { color: #93d6ac; }
  .c { color: #6f7b86; font-style: italic; }
  .n { color: #f0a098; }
  .tree {
    background: #101418;
    border: 1px solid var(--line);
    border-radius: 2.5mm;
    padding: 4mm;
    font-family: Consolas, monospace;
    font-size: 7.4pt;
    line-height: 1.5;
    color: #d9d4c7;
    white-space: pre-wrap;
    break-inside: avoid;
  }
  .tree .dir { color: #93baf0; }
  .tree .file { color: #d9d4c7; }
  .tree .note { color: #6f7b86; }
  .arch {
    display: flex;
    align-items: stretch;
    gap: 2mm;
    margin: 3mm 0 4mm;
    break-inside: avoid;
  }
  .arch-box {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 2.5mm;
    padding: 3mm;
    text-align: center;
    font-size: 8pt;
  }
  .arch-box strong { display: block; margin-bottom: 1mm; font-size: 8.8pt; }
  .arch-box .mono { font-size: 7.2pt; color: var(--dim); }
  .arch-arrow { align-self: center; color: var(--blue); font-size: 15pt; }
  .swatch {
    display: inline-block;
    width: 3.2mm;
    height: 3.2mm;
    border-radius: 1mm;
    vertical-align: -0.6mm;
    margin-right: 1.5mm;
    border: 1px solid rgba(255,255,255,0.18);
  }
  .checklist { list-style: none; padding-left: 0; }
  .checklist li { padding-left: 6mm; position: relative; margin-bottom: 2mm; }
  .checklist li::before {
    content: "✓";
    position: absolute;
    left: 0;
    top: -0.2mm;
    color: var(--green);
    font-weight: 700;
  }
  .toc { columns: 2; column-gap: 10mm; padding-left: 0; list-style: none; }
  .toc li { margin-bottom: 2.2mm; break-inside: avoid; }
  .toc .num { color: var(--blue); font-weight: 700; display: inline-block; min-width: 8mm; }
  .cover {
    min-height: 247mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    break-after: page;
    padding-top: 2mm;
  }
  .brand { display: flex; align-items: center; gap: 4mm; }
  .brand svg { width: 15mm; height: 15mm; }
  .brand .school { font-size: 9.2pt; color: var(--muted); line-height: 1.35; }
  .brand .school strong { color: var(--bone); font-size: 10.4pt; }
  .cover-rule { height: 1px; background: var(--line); margin: 9mm 0 8mm; }
  .cover-title {
    font-size: 42pt;
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1.02;
    color: var(--bone);
  }
  .cover-title .accent { color: var(--blue); }
  .cover-sub { max-width: 135mm; font-size: 11.5pt; color: #c9c3b4; margin-top: 6mm; }
  .cover-tags { margin-top: 7mm; display: flex; flex-wrap: wrap; gap: 2mm; }
  .cover-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2mm 8mm;
    font-size: 8.4pt;
    color: var(--muted);
    border-top: 1px solid var(--line);
    padding-top: 4mm;
    margin-top: 5mm;
  }
  .cover-meta strong { color: var(--bone); }
  .team-table { font-size: 7.7pt; }
  .team-table th, .team-table td { padding: 1.5mm 1.8mm; }
  .fact { font-size: 8.8pt; }
  .fact td:first-child { color: var(--dim); width: 34mm; }
  .quote {
    border-left: 1mm solid var(--green);
    padding-left: 4mm;
    color: #d3cab5;
    font-style: italic;
  }
  .sig { margin-top: 8mm; display: grid; grid-template-columns: 1fr 1fr; gap: 10mm; }
  .sig div { border-top: 1px solid var(--line); padding-top: 2mm; font-size: 8pt; color: var(--muted); }
  .avoid { break-inside: avoid; }
  .pagebreak { break-before: page; }
  a { color: var(--blue); text-decoration: none; }
</style>
<style>
  /* Tema claro de impresión: blanco para papel, con la misma paleta de acentos. */
  html, body { background: #ffffff; color: #1d2227; }
  h2 { border-bottom-color: #d3cab5; }
  h2 .num { color: #2f6fbe; }
  h3, h4, strong { color: #171b1f; }
  .muted { color: #46505a; }
  .dim { color: #5d6874; }
  .lead { color: #46505a; }
  .eyebrow { color: #5d6874; }
  .mono { color: inherit; }
  .card { background: #fbf9f2; border-color: #e7e1d1; }
  .card-kicker { color: #5d6874; }
  .callout { background: #eef4fc; border-color: #bcd3f0; border-left-color: #2f6fbe; }
  .callout.green { background: #eef8f2; border-color: #b9dfc8; border-left-color: #2f8f5b; }
  .callout.red { background: #fdf0ef; border-color: #f0c5c0; border-left-color: #c05046; }
  .tag { background: #e7e1d1; color: #46505a; }
  .tag.blue { background: #dbe8fa; color: #245a9e; }
  .tag.green { background: #dff2e6; color: #256e46; }
  .tag.red { background: #fbe3e1; color: #a53f37; }
  .kpi { background: #fbf9f2; border-color: #e7e1d1; }
  .kpi .value { color: #171b1f; }
  .kpi .label { color: #5d6874; }
  .tbl th { background: #232930; color: #f4f0e4; }
  .tbl td { border-bottom-color: #e7e1d1; color: #1d2227; }
  .tbl tr:nth-child(even) td { background: #faf7ef; }
  .shot { border-color: #d3cab5; }
  .caption { color: #5d6874; }
  .arch-box { background: #fbf9f2; border-color: #e7e1d1; }
  .arch-box .mono { color: #5d6874; }
  .swatch { border-color: rgba(23, 27, 31, 0.2); }
  .checklist li::before { color: #2f8f5b; }
  .toc .num { color: #2f6fbe; }
  .sig div { border-top-color: #d3cab5; color: #5d6874; }
  a { color: #2f6fbe; }

  .cover {
    background: #171b1f;
    color: #f4f0e4;
    border-radius: 4mm;
    padding: 12mm;
    min-height: 247mm;
  }
  .cover .brand .school { color: #a3adb8; }
  .cover .brand .school strong { color: #fbf9f2; }
  .cover .cover-rule { background: rgba(255, 255, 255, 0.12); }
  .cover .eyebrow { color: #7b8794; }
  .cover .cover-title { color: #fbf9f2; }
  .cover .cover-sub { color: #d3cab5; }
  .cover .tag { background: rgba(255, 255, 255, 0.08); color: #d3cab5; }
  .cover .tag.blue { background: rgba(108, 159, 232, 0.16); color: #93baf0; }
  .cover .tag.green { background: rgba(108, 194, 140, 0.15); color: #93d6ac; }
  .cover .tag.red { background: rgba(229, 122, 112, 0.15); color: #f0a098; }
  .cover .tbl th { background: #232930; color: #f4f0e4; }
  .cover .tbl td { border-bottom-color: rgba(255, 255, 255, 0.08); color: #f4f0e4; }
  .cover .tbl tr:nth-child(even) td { background: rgba(255, 255, 255, 0.02); }
  .cover .cover-meta { color: #a3adb8; border-top-color: rgba(255, 255, 255, 0.12); }
  .cover .cover-meta strong { color: #fbf9f2; }
  .cover .mono { color: #f4f0e4; }
  .cover .accent { color: #6c9fe8; }
</style>
</head>
<body>

<!-- ============================ PORTADA ============================ -->
<div class="cover">
  <div>
    <div class="brand">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="9" fill="#232930" stroke="rgba(244,240,228,0.14)"/>
        <path d="M9 11h14M9 21h14M11 9v14M21 9v14" stroke="rgba(244,240,228,0.14)" stroke-width="1"/>
        <circle cx="9" cy="11" r="2.7" fill="#6c9fe8"/>
        <circle cx="23" cy="11" r="2.7" fill="#6cc28c"/>
        <circle cx="9" cy="21" r="2.7" fill="#e57a70"/>
        <circle cx="23" cy="21" r="2.7" fill="#f4f0e4"/>
      </svg>
      <div class="school">
        Instituto Politécnico Nacional<br />
        <strong>Escuela Superior de Cómputo</strong>
      </div>
      <span class="tag blue" style="margin-left:auto">ESCOM · IPN</span>
    </div>

    <div class="cover-rule"></div>
    <p class="eyebrow">Proyecto 2 · ${esc(config.materia)}</p>
    <h1 class="cover-title">Calculadora IP<br /><span class="accent">CIDR y VLSM</span></h1>
    <p class="cover-sub">Dos herramientas web para analizar, dividir y repartir direcciones IPv4 con validación, explicación paso a paso y pruebas automáticas.</p>
    <div class="cover-tags">
      <span class="tag blue">Web app estática</span>
      <span class="tag green">40 pruebas automáticas</span>
      <span class="tag red">Cálculo 100 % en el navegador</span>
      <span class="tag">Sin backend</span>
    </div>
  </div>

  <div>
    ${table(
      ["#", "Integrante", "Matrícula", "Correo", "Rol"],
      teamRows,
      "team-table",
    )}
    <div class="cover-meta">
      <div><strong>Materia:</strong> ${esc(config.materia)}</div>
      <div><strong>Módulo:</strong> ${esc(config.modulo)}</div>
      <div><strong>Profesor:</strong> ${esc(config.profesor)}</div>
      <div><strong>Grupo / semestre:</strong> ${esc(config.grupo)} · ${esc(config.semestre)}</div>
      <div><strong>Fecha:</strong> ${esc(config.fecha)}</div>
      <div><strong>Repositorio:</strong> ${esc(config.repositorio)}</div>
    </div>
  </div>
</div>

<!-- ============================ FICHA E ÍNDICE ============================ -->
<section class="section">
  <h2><span class="num">00</span>Ficha del proyecto</h2>
  ${table(
    ["Dato", "Valor"],
    [
      ["<strong>Proyecto</strong>", "Calculadora IP — CIDR y VLSM"],
      ["<strong>Materia / módulo</strong>", `${esc(config.materia)} · ${esc(config.modulo)}`],
      ["<strong>Equipo</strong>", `${esc(config.equipo)} (${config.integrantes.length} integrantes)`],
      ["<strong>Profesor</strong>", esc(config.profesor)],
      ["<strong>Grupo / semestre</strong>", `${esc(config.grupo)} · ${esc(config.semestre)}`],
      ["<strong>Fecha</strong>", esc(config.fecha)],
      ["<strong>Tipo de solución</strong>", "Aplicación web estática (HTML + CSS + TypeScript). Se ejecuta en el navegador; no requiere servidor de aplicaciones ni base de datos."],
      ["<strong>Stack</strong>", "Astro 6, TypeScript 5.9, Tailwind CSS 4, Vitest 5, Playwright (QA)."],
      ["<strong>Documento</strong>", `<span class="mono">${esc(equipoSlug)}_CalculadoraIP.pdf</span>`],
      ["<strong>Código y ejecutable</strong>", `<span class="mono">${esc(equipoSlug)}_CalculadoraIP.zip</span>`],
      ["<strong>Video</strong>", `<span class="mono">${esc(equipoSlug)}_CalculadoraIP.mp4</span> (guion en docs/Guion_Video.md)`],
      ["<strong>Repositorio</strong>", esc(config.repositorio)],
    ],
    "fact",
  )}

  <h3>Contenido del documento</h3>
  <ol class="toc">
    <li><span class="num">1</span>Introducción y objetivos</li>
    <li><span class="num">2</span>Marco teórico: IPv4, CIDR y VLSM</li>
    <li><span class="num">3</span>Diseño y arquitectura de la solución</li>
    <li><span class="num">4</span>Algoritmos y validaciones</li>
    <li><span class="num">5</span>Funcionalidad y ejemplos de uso</li>
    <li><span class="num">6</span>Código fuente comentado</li>
    <li><span class="num">7</span>Instrucciones de ejecución</li>
    <li><span class="num">8</span>Pruebas y resultados</li>
    <li><span class="num">9</span>Conclusiones y retroalimentación</li>
    <li><span class="num">10</span>Checklist de entrega y roles</li>
    <li><span class="num">A</span>Anexo A: comandos rápidos</li>
    <li><span class="num">B</span>Anexo B: glosario</li>
  </ol>

  <div class="callout">
    <p><strong>Cómo leer este documento.</strong> Las secciones 1 a 5 explican el problema, la teoría y el diseño; las secciones 6 y 7 muestran el código y cómo ejecutarlo; la sección 8 concentra los casos de prueba y la evidencia; la sección 9 cierra con conclusiones y retroalimentación del equipo.</p>
  </div>
</section>

<!-- ============================ 1. INTRODUCCIÓN ============================ -->
<section class="section">
  <h2><span class="num">01</span>Introducción y objetivos</h2>

  <h3>1.1 Objetivo general</h3>
  <p class="lead">Construir dos calculadoras web que resuelvan, con precisión y explicaciones claras, los cálculos de direccionamiento IPv4 que se hacen a mano en la materia de Redes de Computadoras: análisis CIDR y asignación VLSM.</p>

  <h3>1.2 Objetivos específicos</h3>
  <ul>
    <li>Calcular red, rango de hosts, broadcast, máscara, prefijo, wildcard y hosts útiles a partir de una IP y un prefijo o máscara decimal.</li>
    <li>Dividir una red en subredes iguales por número de subredes o por hosts requeridos, sin solapamientos.</li>
    <li>Repartir una red base con VLSM: ordenar requerimientos, calcular la máscara mínima de cada subred y asignar bloques contiguos.</li>
    <li>Reportar espacio desperdiciado, direcciones reservadas, espacio libre y aprovechamiento.</li>
    <li>Validar entradas y explicar los errores con mensajes accionables, incluido el caso de espacio insuficiente.</li>
    <li>Entregar una aplicación ejecutable, código comentado, pruebas automáticas, README y documentación reproducible.</li>
  </ul>

  <h3>1.3 Problemática</h3>
  <p>Los cálculos de subredes son propensos a errores cuando se hacen a mano: un bit mal contado cambia la máscara, el rango o el broadcast; al dividir en bloques, es fácil solapar direcciones o desperdiciar espacio. En VLSM el problema crece porque cada subred puede tener una máscara distinta y el orden de asignación importa.</p>
  <p>Las calculadoras existentes suelen mostrar solo el resultado. Para aprender, hace falta ver <strong>por qué</strong> se llegó a él: qué fórmula se aplicó, cuántas direcciones se reservaron, cuánto se desperdició y qué espacio queda libre.</p>

  <h3>1.4 Alcance</h3>
  <div class="grid2">
    <div class="card">
      <h4>Incluido</h4>
      <ul class="small">
        <li>IPv4 con prefijo 0–32 y máscara decimal contigua.</li>
        <li>CIDR: análisis completo, binario, clase y ámbito.</li>
        <li>División en subredes iguales por cantidad o por hosts.</li>
        <li>VLSM con nombres, hosts, holgura y bloques libres.</li>
        <li>Exportación de resumen y CSV; presets del PDF y campus.</li>
        <li>Validación, pruebas unitarias y QA de navegador.</li>
      </ul>
    </div>
    <div class="card">
      <h4>Fuera de alcance</h4>
      <ul class="small">
        <li>IPv6 (el proyecto se enfoca en IPv4).</li>
        <li>Configuración de equipos reales o protocolos de enrutamiento.</li>
        <li>Autenticación, base de datos o servicios en la nube.</li>
        <li>Cálculo de VLANs, NAT o ACLs más allá del wildcard.</li>
        <li>Persistencia de datos entre sesiones.</li>
      </ul>
    </div>
  </div>

  <h3>1.5 Resumen de resultados</h3>
  <div class="kpis">
    <div class="kpi"><div class="value">2</div><div class="label">Calculadoras integradas</div></div>
    <div class="kpi"><div class="value">40</div><div class="label">Pruebas unitarias correctas</div></div>
    <div class="kpi"><div class="value">42</div><div class="label">Comprobaciones de navegador</div></div>
    <div class="kpi"><div class="value">0</div><div class="label">Errores de consola</div></div>
  </div>
  <div class="callout green">
    <p><strong>Resultado principal.</strong> El caso del PDF (192.168.0.0/24 con A=100, B=50, C=25 y D=10) se resuelve en A /25, B /26, C /27 y D /28, dejando libre 192.168.0.240/28. Se asignan 240 de 256 direcciones, con 232 hosts útiles, 8 reservadas para red/broadcast, 47 de holgura y 90.6 % de aprovechamiento.</p>
  </div>
</section>

<!-- ============================ 2. MARCO TEÓRICO ============================ -->
<section class="section">
  <h2><span class="num">02</span>Marco teórico: IPv4, CIDR y VLSM</h2>

  <h3>2.1 Direcciones IPv4</h3>
  <p>Una dirección IPv4 ocupa 32 bits y se escribe como cuatro octetos decimales separados por puntos. Internamente la aplicación la convierte a un entero sin signo de 32 bits (0 a 4 294 967 295). Trabajar con enteros evita errores de formato y hace que las operaciones de red sean sumas, comparaciones y máscaras de bits.</p>
  <div class="grid3">
    <div class="card"><div class="card-kicker">Dirección</div><h4 class="mono">192.168.10.0</h4><p class="tiny muted">11000000.10101000.00001010.00000000</p></div>
    <div class="card"><div class="card-kicker">Máscara /24</div><h4 class="mono">255.255.255.0</h4><p class="tiny muted">11111111.11111111.11111111.00000000</p></div>
    <div class="card"><div class="card-kicker">Bits de host</div><h4 class="mono green">8</h4><p class="tiny muted">2⁸ = 256 direcciones</p></div>
  </div>

  <h3>2.2 Máscara, prefijo y wildcard</h3>
  <p>La máscara marca con unos los bits de red y con ceros los bits de host. El prefijo es la cantidad de unos iniciales: <span class="mono">/24</span> equivale a <span class="mono">255.255.255.0</span>. El wildcard es la máscara invertida y se usa para identificar la parte de host.</p>
  <div class="callout">
    <p><strong>Regla de continuidad.</strong> Una máscara válida tiene todos sus unos a la izquierda y todos sus ceros a la derecha. Por eso <span class="mono">255.255.254.0</span> es válida (/23), pero <span class="mono">255.0.255.0</span> no lo es.</p>
  </div>

  <h3>2.3 Fórmulas de CIDR</h3>
  ${table(
    ["Cantidad", "Fórmula", "Ejemplo con /26"],
    [
      ["Direcciones totales", "<span class='mono'>2^(32 − prefijo)</span>", "2⁶ = 64"],
      ["Hosts útiles", "<span class='mono'>2^(32 − prefijo) − 2</span>", "64 − 2 = 62"],
      ["Máscara", "Unos en los primeros <em>p</em> bits", "255.255.255.192"],
      ["Wildcard", "<span class='mono'>2^(32 − prefijo) − 1</span>", "0.0.0.63"],
      ["Red", "<span class='mono'>IP AND máscara</span>", "172.16.5.128"],
      ["Broadcast", "<span class='mono'>red + total − 1</span>", "172.16.5.191"],
      ["Primer host", "<span class='mono'>red + 1</span>", "172.16.5.129"],
      ["Último host", "<span class='mono'>broadcast − 1</span>", "172.16.5.190"],
    ],
    "compact",
  )}

  <h3>2.4 CIDR frente a VLSM</h3>
  <div class="grid2">
    <div class="card">
      <div class="card-kicker">CIDR</div>
      <h4>Bloques del mismo tamaño</h4>
      <p class="small">Se elige un prefijo y se generan <span class="mono">2^(nuevo − base)</span> subredes iguales. Es sencillo y ordenado, pero si los requerimientos son muy distintos, las subredes pequeñas desperdician direcciones.</p>
    </div>
    <div class="card">
      <div class="card-kicker">VLSM</div>
      <h4>Una máscara por requerimiento</h4>
      <p class="small">Cada subred recibe la máscara más pequeña que la acomoda. Al ordenar de mayor a menor y asignar bloques contiguos, se aprovecha mejor el espacio y no hay solapamientos.</p>
    </div>
  </div>

  <h3>2.5 Prefijos más comunes</h3>
  ${table(
    ["Prefijo", "Máscara", "Wildcard", "Direcciones", "Hosts útiles"],
    prefixRows,
    "compact",
  )}

  <h3>2.6 Casos especiales</h3>
  <ul>
    <li><strong>/31:</strong> el bloque tiene 2 direcciones. La fórmula clásica da 0 hosts, pero la RFC 3021 permite usar ambas en enlaces punto a punto. La calculadora lo advierte y muestra 0 hosts útiles con la fórmula de clase.</li>
    <li><strong>/32:</strong> una sola dirección. Se usa para rutas a un host; no separa red de broadcast.</li>
    <li><strong>/0:</strong> la máscara es 0.0.0.0 y el bloque abarca todo el espacio IPv4.</li>
  </ul>
</section>

<!-- ============================ 3. DISEÑO ============================ -->
<section class="section">
  <h2><span class="num">03</span>Diseño y arquitectura</h2>

  <h3>3.1 Tipo de solución</h3>
  <p>Se eligió una <strong>aplicación web estática</strong> porque cumple con el requisito de “carpeta lista para desplegar”, no necesita backend y permite demostrar los cálculos en cualquier navegador. Todo el procesamiento ocurre en el cliente: no se envían direcciones ni requerimientos a ningún servidor.</p>
  <div class="callout green">
    <p><strong>Ventaja didáctica.</strong> Al ser estática, el ejecutable es simplemente la carpeta <span class="mono">dist/</span>. Se puede abrir con un servidor local mínimo (<span class="mono">iniciar.bat</span>) o publicar en GitHub Pages, Netlify o Vercel sin cambiar código.</p>
  </div>

  <h3>3.2 Tecnologías</h3>
  ${table(
    ["Componente", "Tecnología", "Uso en el proyecto"],
    [
      ["Framework de sitio", "Astro 6.4", "Genera HTML estático y organiza páginas/componentes."],
      ["Lenguaje", "TypeScript 5.9", "Tipos estrictos en la lógica de cálculo y en los scripts de UI."],
      ["Estilos", "Tailwind CSS 4.3", "Sistema de diseño, utilidades y componentes reutilizables."],
      ["Pruebas", "Vitest 5.1", "40 pruebas unitarias de IP, subnetting y VLSM."],
      ["QA de navegador", "Playwright Core", "46 comprobaciones de interfaz y capturas para el documento."],
      ["Documento", "Chrome + HTML/CSS", "Impresión A4 del reporte con portada y código resaltado."],
    ],
    "compact",
  )}

  <h3>3.3 Arquitectura</h3>
  <div class="arch">
    <div class="arch-box"><strong>Entrada</strong><span class="mono">HTML + formularios</span><br /><span class="tiny muted">IP, prefijo, hosts</span></div>
    <div class="arch-arrow">→</div>
    <div class="arch-box"><strong>Validación</strong><span class="mono">scripts del cliente</span><br /><span class="tiny muted">mensajes claros</span></div>
    <div class="arch-arrow">→</div>
    <div class="arch-box"><strong>Lógica pura</strong><span class="mono">ip.ts · subnetting.ts · vlsm.ts</span><br /><span class="tiny muted">enteros de 32 bits</span></div>
    <div class="arch-arrow">→</div>
    <div class="arch-box"><strong>Salida</strong><span class="mono">DOM + CSV</span><br /><span class="tiny muted">tablas, mapa, pasos</span></div>
  </div>
  <p class="caption">La lógica no toca el DOM, por lo que se puede probar con Vitest y reutilizar desde cualquier interfaz.</p>

  <h3>3.4 Estructura de archivos</h3>
  <div class="tree"><span class="dir">calculadora-ip/</span>
├── <span class="dir">src/</span>
│   ├── <span class="dir">components/</span>   <span class="note">Header, Footer, BinaryStrip</span>
│   ├── <span class="dir">layouts/</span>      <span class="note">Base.astro (fuentes, meta, skip link)</span>
│   ├── <span class="dir">lib/</span>          <span class="note">lógica pura, sin DOM</span>
│   │   ├── <span class="file">ip.ts</span>          <span class="note">parseo, máscaras, CIDR, clase y ámbito</span>
│   │   ├── <span class="file">subnetting.ts</span>  <span class="note">prefijo por hosts, divisiones, bloques libres</span>
│   │   └── <span class="file">vlsm.ts</span>        <span class="note">algoritmo VLSM completo</span>
│   ├── <span class="dir">pages/</span>        <span class="note">index, cidr, vlsm, guia</span>
│   └── <span class="dir">styles/</span>       <span class="note">global.css (tokens y componentes)</span>
├── <span class="dir">tests/</span>            <span class="note">40 pruebas Vitest</span>
├── <span class="dir">scripts/</span>          <span class="note">equipo.json, export-results.ts, build-doc.mjs, qa.mjs, serve.mjs</span>
├── <span class="dir">docs/</span>             <span class="note">PDF, guion del video, explicación, capturas</span>
├── <span class="dir">dist/</span>             <span class="note">sitio estático listo para desplegar</span>
├── <span class="file">iniciar.bat</span>       <span class="note">arranca el servidor local en Windows</span>
└── <span class="file">README.md</span>         <span class="note">instalación, ejecución y pruebas</span></div>

  <h3>3.5 Sistema de diseño</h3>
  <p>La interfaz usa una paleta sobria con significado constante: el azul identifica la red, el verde los hosts y el rojo el broadcast o los errores. El gris meteoro se usa para fondos y superficies; el blanco hueso para texto y acciones.</p>
  ${table(
    ["Token", "Color", "Uso"],
    [
      [`<span class="swatch" style="background:#171b1f"></span><span class="mono">meteor-950</span>`, "#171b1f", "Fondo general"],
      [`<span class="swatch" style="background:#1d2227"></span><span class="mono">meteor-900</span>`, "#1d2227", "Paneles"],
      [`<span class="swatch" style="background:#fbf9f2"></span><span class="mono">bone-50</span>`, "#fbf9f2", "Texto principal"],
      [`<span class="swatch" style="background:#6c9fe8"></span><span class="mono">ip-blue</span>`, "#6c9fe8", "Red, enlaces y foco"],
      [`<span class="swatch" style="background:#6cc28c"></span><span class="mono">ip-green</span>`, "#6cc28c", "Hosts y resultados correctos"],
      [`<span class="swatch" style="background:#e57a70"></span><span class="mono">ip-red</span>`, "#e57a70", "Broadcast y errores"],
    ],
    "compact",
  )}

  <h3>3.6 Flujo de datos</h3>
  <ol>
    <li><strong>Captura:</strong> el usuario escribe una IP, un prefijo, una máscara o una lista de requerimientos.</li>
    <li><strong>Validación:</strong> se revisan octetos, prefijos, máscaras contiguas, hosts enteros y capacidad de la red base.</li>
    <li><strong>Cálculo:</strong> la lógica pura convierte a enteros, aplica máscaras, ordena requerimientos y asigna bloques.</li>
    <li><strong>Render:</strong> se actualizan tarjetas, tablas, binario, mapa de asignación y pasos. No hay recarga de página.</li>
    <li><strong>Exportación:</strong> el resumen se copia al portapapeles y la tabla VLSM se descarga en CSV con BOM para Excel.</li>
  </ol>

  <h3>3.7 Decisiones de diseño</h3>
  <ul>
    <li><strong>Enteros de 32 bits:</strong> evita ambigüedades al sumar direcciones y simplifica las operaciones AND/OR.</li>
    <li><strong>Lógica separada de la UI:</strong> los módulos de <span class="mono">src/lib</span> no tocan el DOM; son fáciles de probar y explicar.</li>
    <li><strong>Sin framework de UI:</strong> los formularios son ligeros y no necesitan estado complejo; los scripts de cada página bastan.</li>
    <li><strong>Errores accionables:</strong> cada validación dice qué corregir y, cuando falta espacio, sugiere un prefijo mayor.</li>
    <li><strong>Resultado explicado:</strong> además del número, se muestra el paso a paso, la holgura y el espacio libre.</li>
    <li><strong>Diseño responsive:</strong> una columna en móvil y dos o cuatro en escritorio; tablas con desplazamiento horizontal.</li>
  </ul>

  <h3>3.8 Accesibilidad y usabilidad</h3>
  <p>Se incluyen etiquetas asociadas a cada campo, mensajes con <span class="mono">role="alert"</span>, foco visible, enlace para saltar al contenido, contraste alto y soporte para <span class="mono">prefers-reduced-motion</span>. Los resultados se anuncian en regiones <span class="mono">aria-live</span> y los botones tienen texto o etiquetas accesibles.</p>
</section>

<!-- ============================ 4. ALGORITMOS ============================ -->
<section class="section">
  <h2><span class="num">04</span>Algoritmos y validaciones</h2>

  <h3>4.1 Análisis CIDR</h3>
  <p>El análisis sigue una cadena de operaciones sobre enteros. Primero se parsea la IP y el prefijo; luego se calcula la máscara y se obtiene la red con AND; el broadcast se obtiene sumando el tamaño del bloque menos uno. El rango de hosts solo existe si hay al menos 2 direcciones utilizables.</p>
  <div class="callout">
    <p><strong>Ejemplo 172.16.5.130/26.</strong> La máscara es 255.255.255.192 y el bloque tiene 64 direcciones. La IP cae en el bloque que empieza en .128, así que la red es 172.16.5.128, el broadcast .191 y el rango útil .129–.190.</p>
  </div>
  ${table(
    ["Dato", "Resultado"],
    [
      ["Red", `<span class="mono">${esc(cidr[1].analysis.networkText)}/${cidr[1].analysis.prefix}</span>`],
      ["Máscara", `<span class="mono">${esc(cidr[1].analysis.maskText)}</span>`],
      ["Wildcard", `<span class="mono">${esc(cidr[1].analysis.wildcardText)}</span>`],
      ["Primer host", `<span class="mono">${esc(cidr[1].analysis.firstHostText)}</span>`],
      ["Último host", `<span class="mono">${esc(cidr[1].analysis.lastHostText)}</span>`],
      ["Broadcast", `<span class="mono">${esc(cidr[1].analysis.broadcastText)}</span>`],
      ["Hosts útiles", `<span class="mono">${cidr[1].analysis.usableHosts}</span>`],
    ],
    "compact",
  )}

  <h3>4.2 División en subredes iguales</h3>
  <p>Hay dos modos. Por <strong>número de subredes</strong>, se busca la menor cantidad de bits <span class="mono">b</span> tal que <span class="mono">2^b ≥ s</span>; el nuevo prefijo es <span class="mono">base + b</span>. Por <strong>hosts por subred</strong>, se busca la menor cantidad de bits de host <span class="mono">k</span> tal que <span class="mono">2^k − 2 ≥ h</span>; el prefijo es <span class="mono">32 − k</span> y el número de subredes que caben es <span class="mono">2^(nuevo − base)</span>.</p>
  <div class="grid2">
    <div class="card">
      <div class="card-kicker">Ejemplo por cantidad</div>
      <h4>4 subredes desde /24</h4>
      <p class="small">2² = 4 → se agregan 2 bits → /26. Cada subred tiene 62 hosts útiles.</p>
    </div>
    <div class="card">
      <div class="card-kicker">Ejemplo por hosts</div>
      <h4>50 hosts por subred</h4>
      <p class="small">50 + 2 = 52 → 2⁶ = 64 → /26. En una /24 caben 4 subredes.</p>
    </div>
  </div>

  <h3>4.3 Algoritmo VLSM</h3>
  <p>La implementación sigue el pseudocódigo del proyecto, con una mejora: en lugar de usar logaritmos de punto flotante, busca el menor entero <span class="mono">k</span> con un ciclo, lo que evita errores de redondeo en potencias exactas.</p>
  <ol>
    <li><strong>Preparar:</strong> para cada requerimiento se calculan <span class="mono">needed = hosts + 2</span> direcciones (red y broadcast).</li>
    <li><strong>Ordenar:</strong> de mayor a menor por <span class="mono">needed</span>; los empates conservan el orden de captura.</li>
    <li><strong>Máscara mínima:</strong> se busca el menor <span class="mono">k</span> con <span class="mono">2^k ≥ needed</span>; el prefijo es <span class="mono">32 − k</span> y el bloque mide <span class="mono">2^k</span>.</li>
    <li><strong>Asignar:</strong> el bloque toma la dirección actual como red; el broadcast es <span class="mono">red + tamaño − 1</span>; el puntero avanza el tamaño.</li>
    <li><strong>Validar:</strong> si la suma de bloques supera la red base, se lanza un error con la cantidad faltante y un prefijo sugerido.</li>
    <li><strong>Resumir:</strong> se calculan asignadas, útiles, reservadas, holgura, libres y aprovechamiento; el espacio libre se descompone en bloques CIDR alineados.</li>
  </ol>

  <h4>Pseudocódigo</h4>
  <div class="tree">entrada: red_base, prefijo_base, subredes[(nombre, hosts)]
para cada subred: needed = hosts + 2
ordenar subredes por needed descendente
si suma(bloques) &gt; 2^(32 - prefijo_base): error "espacio insuficiente"

puntero = red_base
para cada subred:
    k = menor entero tal que 2^k &gt;= needed
    prefijo = 32 - k
    tamaño = 2^k
    red = puntero
    primer_host = red + 1
    ultimo_host = red + tamaño - 2
    broadcast = red + tamaño - 1
    guardar (red, prefijo, rango, broadcast, útiles, holgura)
    puntero = puntero + tamaño

fin para
espacio_libre = red_base + 2^(32 - prefijo_base) - puntero</div>

  <h3>4.4 Bloques libres</h3>
  <p>El espacio que queda después de la última subred no siempre es un solo bloque CIDR válido. Para descomponerlo, se toma en cada paso el bloque más grande que empiece en la dirección actual, esté alineado y no se salga del rango. Así el resultado es una lista de bloques reutilizables, por ejemplo <span class="mono">192.168.0.240/28</span>.</p>

  <h3>4.5 Validaciones y errores</h3>
  ${table(
    ["Entrada", "Validación", "Mensaje / comportamiento"],
    [
      ["IP", "Cuatro octetos, solo dígitos, 0–255, sin ceros a la izquierda", "«El octeto 2 (“168”) debe estar entre 0 y 255»"],
      ["Prefijo", "Entero entre 0 y 32", "«El prefijo debe ser un número entero entre 0 y 32»"],
      ["Máscara", "Contigua al invertirla", "«La máscara no es contigua. Ejemplos válidos: …»"],
      ["Hosts", "Entero ≥ 1", "«La cantidad de hosts debe ser un número entero mayor o igual a 1»"],
      ["Subredes", "Entero ≥ 1 y prefijo resultante ≤ 32", "«No quedan suficientes bits…»"],
      ["Capacidad", "Suma de bloques ≤ tamaño base", "«La red base … tiene 256 direcciones, pero las subredes necesitan 384. Prueba con /23…»"],
    ],
    "compact",
  )}

  <h3>4.6 Complejidad</h3>
  <p>El análisis CIDR es <span class="mono">O(1)</span>: un número fijo de operaciones de bits. La división en subredes es <span class="mono">O(min(2^b, límite))</span> porque solo se previsualizan hasta 128 filas. VLSM es <span class="mono">O(n log n)</span> por el ordenamiento y <span class="mono">O(n)</span> para asignar, con <span class="mono">n</span> requerimientos. El desglose de bloques libres es <span class="mono">O(log tamaño)</span> por bloque generado.</p>
</section>

<!-- ============================ 5. FUNCIONALIDAD ============================ -->
<section class="section">
  <h2><span class="num">05</span>Funcionalidad y ejemplos de uso</h2>

  <h3>5.1 Página de inicio</h3>
  <p>La página principal es un selector directo: presenta las dos calculadoras como opciones principales desde el primer pantallazo, sin contenido intermedio. La teoría queda como enlace secundario en la parte inferior.</p>
  <img class="shot" src="${shots.hero}" alt="Selector de calculadoras en la página de inicio" />
  <p class="caption">Figura 1. Página de inicio: el selector con las dos calculadoras y el acceso a la guía.</p>

  <h3>5.2 Calculadora CIDR</h3>
  <p>El formulario acepta una IP con prefijo (por ejemplo <span class="mono">10.0.0.0/8</span>) o una IP y una máscara decimal. Al escribir, el resultado se actualiza sin recargar. El explorador permite dividir la red por cantidad de subredes o por hosts por subred.</p>
  <img class="shot" src="${shots.cidrForm}" alt="Formulario de la calculadora CIDR" />
  <p class="caption">Figura 2. Entrada de la calculadora CIDR con modos de prefijo y máscara decimal.</p>
  <img class="shot" src="${shots.cidrResults}" alt="Resultados de la calculadora CIDR" />
  <p class="caption">Figura 3. Resultados: red, broadcast, rango, hosts, detalle, binario y explorador de subredes.</p>

  <h3>5.3 Calculadora VLSM</h3>
  <p>La calculadora VLSM recibe una red base y una lista de requerimientos. El orden de captura no importa: el algoritmo ordena de mayor a menor. El resultado incluye mapa de asignación, tabla con red/máscara/rango/broadcast/útiles/holgura, bloques libres y el paso a paso.</p>
  <img class="shot" src="${shots.vlsmMap}" alt="Mapa de asignación VLSM" />
  <p class="caption">Figura 4. Mapa de asignación y totales del caso del PDF.</p>
  <img class="shot" src="${shots.vlsmTable}" alt="Tabla de subredes VLSM" />
  <p class="caption">Figura 5. Tabla de subredes asignadas, con holgura por bloque.</p>

  <h4>Caso del PDF</h4>
  ${table(
    ["#", "Subred", "Pedidos", "Red / prefijo", "Máscara", "Rango de hosts", "Broadcast", "Útiles", "Holgura"],
    vlsmRows,
    "compact",
  )}
  <div class="grid2">
    <div class="card">
      <div class="card-kicker">Totales</div>
      <h4>${vlsm.assignedAddresses} de ${vlsm.baseSize} asignadas</h4>
      <p class="small">${vlsm.freeAddresses} libres · ${vlsm.usableAddresses} hosts útiles · ${vlsm.reservedAddresses} red/broadcast · ${vlsm.slackAddresses} de holgura.</p>
    </div>
    <div class="card">
      <div class="card-kicker">Aprovechamiento</div>
      <h4>${vlsm.efficiency.toFixed(1)} %</h4>
      <p class="small">Se calcula como hosts útiles asignados / direcciones de la red base. El bloque libre es ${vlsm.freeBlocks.map((block) => block.cidr).join(", ")}.</p>
    </div>
  </div>

  <h3>5.4 Manejo del error de espacio</h3>
  <p>Si la red base no alcanza, la herramienta no muestra una tabla incompleta: explica cuántas direcciones se necesitan y sugiere un prefijo mayor. El ejemplo A=200 y B=100 sobre 192.168.0.0/24 requiere 384 direcciones y sugiere /23.</p>
  <img class="shot narrow" src="${shots.error}" alt="Mensaje de error por espacio insuficiente" />
  <p class="caption">Figura 6. Error claro cuando la suma de bloques supera la red base.</p>

  <h3>5.5 Exportación y presets</h3>
  <ul>
    <li><strong>Copiar resumen:</strong> genera un texto con todos los datos para pegarlo en un reporte.</li>
    <li><strong>CSV:</strong> descarga la tabla VLSM con BOM UTF-8 para abrirla correctamente en Excel.</li>
    <li><strong>Caso del PDF:</strong> carga 192.168.0.0/24 con A=100, B=50, C=25 y D=10.</li>
    <li><strong>Campus:</strong> carga 10.0.0.0/16 con Ventas=500, TI=200, RH=100, Almacén=50 y Dirección=20.</li>
  </ul>

  <h3>5.6 Guía integrada</h3>
  <p>La ruta <span class="mono">/guia/</span> contiene la teoría, las fórmulas, el algoritmo, los casos de prueba y los errores comunes. Así el usuario puede entender el resultado sin salir del sitio.</p>
</section>

<!-- ============================ 6. CÓDIGO ============================ -->
<section class="section">
  <h2><span class="num">06</span>Código fuente comentado</h2>
  <p>La lógica se divide en tres módulos independientes. Los fragmentos siguientes son los más relevantes para la evaluación; el código completo, con todos los comentarios, está en el ZIP y en el repositorio.</p>

  <h3>6.1 Núcleo IPv4: <span class="mono">src/lib/ip.ts</span></h3>
  <p>El módulo convierte direcciones a enteros, valida prefijos y máscaras, y calcula todos los datos de una subred. Los comentarios explican por qué se evitan los ceros a la izquierda y cómo se comprueba que una máscara sea contigua.</p>
  ${await codeBlock(
    "Conversión, máscaras y análisis completo",
    "src/lib/ip.ts",
    [
      [93, 138],
      [152, 177],
      [218, 247],
      [444, 502],
    ],
  )}

  <h3>6.2 Subnetting: <span class="mono">src/lib/subnetting.ts</span></h3>
  <p>Aquí vive el cálculo del prefijo mínimo para una cantidad de hosts, la división en bloques iguales y la descomposición del espacio libre en bloques CIDR alineados.</p>
  ${await codeBlock(
    "Prefijo por hosts, divisiones y bloques libres",
    "src/lib/subnetting.ts",
    [
      [56, 84],
      [163, 197],
      [224, 260],
    ],
  )}

  <h3>6.3 VLSM: <span class="mono">src/lib/vlsm.ts</span></h3>
  <p>El algoritmo normaliza y valida los requerimientos, ordena, comprueba la capacidad global, asigna bloques contiguos y construye el resumen. Es el archivo más importante para el proyecto.</p>
  ${await codeBlock(
    "Algoritmo VLSM completo",
    "src/lib/vlsm.ts",
    [
      [86, 191],
      [193, 236],
    ],
  )}

  <h3>6.4 Pruebas: <span class="mono">tests/</span></h3>
  <p>Las pruebas usan Vitest y verifican tanto los resultados correctos como los errores esperados. Se agrupan por módulo: 14 de IP, 13 de subnetting y 13 de VLSM.</p>
  ${await codeBlock(
    "Ejemplo de pruebas de análisis CIDR",
    "tests/ip.test.ts",
    [[23, 60]],
  )}

  <div class="avoid">
    <h3>6.5 Interfaz y estilos</h3>
    <p>Los scripts de <span class="mono">src/pages/cidr.astro</span> y <span class="mono">src/pages/vlsm.astro</span> escuchan los formularios, llaman a la lógica pura y actualizan el DOM. No contienen cálculos de red: solo presentación, validación de formato y eventos. Los estilos viven en <span class="mono">src/styles/global.css</span>, con tokens para la paleta y componentes como <span class="mono">panel</span>, <span class="mono">stat</span>, <span class="mono">data-table</span> y <span class="mono">vlsm-map</span>.</p>
    <div class="callout">
      <p><strong>Separación de responsabilidades.</strong> Si mañana se cambia la interfaz, la lógica y las pruebas siguen funcionando. Si se cambia el algoritmo, la interfaz no necesita cambios.</p>
    </div>
  </div>
</section>

<!-- ============================ 7. EJECUCIÓN ============================ -->
<section class="section">
  <h2><span class="num">07</span>Instrucciones de ejecución</h2>

  <h3>7.1 Requisitos</h3>
  <ul>
    <li><strong>Node.js 22.x</strong> (probado con 22.23.2). Astro 6 requiere Node ≥ 22.12.</li>
    <li><strong>pnpm 10+</strong> (probado con 12.3.4). También se puede usar npm, pero el lockfile es de pnpm.</li>
    <li>Navegador moderno: Chrome, Edge, Firefox o Safari.</li>
    <li>Opcional para regenerar el PDF: un Chrome/Chromium instalado (no se usa Python).</li>
  </ul>

  <h3>7.2 Instalación y desarrollo</h3>
  <div class="tree">cd calculadora-ip
pnpm install
pnpm dev          <span class="note"># servidor de desarrollo en http://localhost:4321</span></div>

  <h3>7.3 Compilación y vista previa</h3>
  <div class="tree">pnpm build        <span class="note"># genera dist/ (sitio estático)</span>
pnpm preview      <span class="note"># sirve dist/ en http://localhost:4321</span>
pnpm serve        <span class="note"># servidor mínimo sin dependencias, puerto 4173</span></div>

  <h3>7.4 Ejecutable web</h3>
  <p>La carpeta <span class="mono">dist/</span> es el ejecutable: contiene HTML, CSS, JavaScript y fuentes. Se puede publicar tal cual en cualquier hosting estático. En Windows, el archivo <span class="mono">iniciar.bat</span> inicia un servidor local y abre el navegador; requiere Node.js instalado.</p>
  <div class="callout">
    <p><strong>Importante:</strong> abrir <span class="mono">dist/index.html</span> con doble clic puede fallar por las rutas absolutas y las fuentes. Usa <span class="mono">iniciar.bat</span> o <span class="mono">pnpm preview</span>.</p>
  </div>

  <h3>7.5 Pruebas</h3>
  <div class="tree">pnpm test         <span class="note"># 40 pruebas unitarias (Vitest)</span>
pnpm check        <span class="note"># revisión de tipos y plantillas Astro</span>
node scripts/qa.mjs  <span class="note"># QA de navegador (requiere pnpm preview activo)</span></div>

  <h3>7.6 Regenerar documento y paquete</h3>
  <div class="tree">pnpm resultados   <span class="note"># actualiza docs/resultados.json y el CSV</span>
pnpm doc          <span class="note"># genera docs/EquipoX_CalculadoraIP.pdf</span>
pnpm empaquetar   <span class="note"># crea entrega/EquipoX_CalculadoraIP.zip</span></div>
  <p>Antes de generar la entrega, edita <span class="mono">scripts/equipo.json</span> con los nombres, matrículas, correos, profesor, grupo y repositorio reales. El nombre del PDF y del ZIP se toma del campo <span class="mono">equipo</span>.</p>

  <h3>7.7 Despliegue</h3>
  <ul>
    <li><strong>GitHub Pages:</strong> publica el contenido de <span class="mono">dist/</span> en la rama <span class="mono">gh-pages</span> o usa una acción de Astro.</li>
    <li><strong>Netlify / Vercel:</strong> comando de build <span class="mono">pnpm build</span>, directorio de salida <span class="mono">dist</span>.</li>
    <li><strong>Servidor propio:</strong> copia <span class="mono">dist/</span> a cualquier servidor web estático (Nginx, Apache, IIS).</li>
  </ul>

  <h3>7.8 Solución de problemas</h3>
  ${table(
    ["Síntoma", "Causa probable", "Solución"],
    [
      ["Astro pide Node ≥ 22.23", "Versión de Node antigua", "Actualiza Node a 22.23.2 o superior; el proyecto usa Astro 6 para compatibilidad."],
      ["Error de esbuild/sharp al instalar", "Scripts de instalación bloqueados por pnpm", "Ejecuta <span class='mono'>pnpm approve-builds --all</span> y reinstala."],
      ["La página se ve sin estilos al abrir el HTML", "Rutas absolutas y fuentes", "Usa <span class='mono'>iniciar.bat</span> o <span class='mono'>pnpm preview</span>."],
      ["El PDF no se genera", "Chrome no está en la ruta esperada", "Define <span class='mono'>DOC_CHROME</span> con la ruta del ejecutable de Chrome."],
      ["El puerto 4321 está ocupado", "Otro proceso lo usa", "Cierra el proceso o usa <span class='mono'>pnpm dev --port 4322</span>."],
    ],
    "compact",
  )}
</section>

<!-- ============================ 8. PRUEBAS ============================ -->
<section class="section">
  <h2><span class="num">08</span>Pruebas y resultados</h2>

  <h3>8.1 Estrategia</h3>
  <p>Se aplicaron dos niveles de verificación. Primero, <strong>pruebas unitarias</strong> con Vitest sobre la lógica pura: conversiones, máscaras, prefijos, divisiones, VLSM y errores. Después, <strong>pruebas de navegador</strong> con Playwright: se cargan las páginas, se introducen datos, se comparan los textos visibles y se revisa que no haya errores de consola.</p>

  <h3>8.2 Resultado de las pruebas unitarias</h3>
  <div class="kpis">
    <div class="kpi"><div class="value">40</div><div class="label">Pruebas correctas</div></div>
    <div class="kpi"><div class="value">3</div><div class="label">Archivos de prueba</div></div>
    <div class="kpi"><div class="value">0</div><div class="label">Fallos</div></div>
    <div class="kpi"><div class="value">661 ms</div><div class="label">Duración aproximada</div></div>
  </div>
  ${table(
    ["Archivo", "Cobertura principal", "Pruebas"],
    [
      ["<span class='mono'>tests/ip.test.ts</span>", "Parseo, formato, prefijos, máscaras, red, broadcast, clase y ámbito", "14"],
      ["<span class='mono'>tests/subnetting.test.ts</span>", "Prefijo por hosts, divisiones por cantidad/hosts, bloques libres, límites", "13"],
      ["<span class='mono'>tests/vlsm.test.ts</span>", "Caso del PDF, orden, holgura, espacio libre, errores de capacidad", "13"],
    ],
    "compact",
  )}

  <h3>8.3 Casos CIDR</h3>
  ${table(
    ["Entrada", "Red", "Rango de hosts", "Broadcast", "Útiles", "Máscara"],
    cidrRows,
    "compact",
  )}
  <p class="caption">Resultados calculados por la misma librería que usa la aplicación (docs/resultados.json).</p>

  <h3>8.4 Caso VLSM del PDF</h3>
  <p>Red base 192.168.0.0/24 con A=100, B=50, C=25 y D=10. El algoritmo ordena A, B, C, D y asigna bloques contiguos. El espacio libre restante es 192.168.0.240/28.</p>
  ${table(
    ["#", "Subred", "Pedidos", "Red / prefijo", "Máscara", "Rango de hosts", "Broadcast", "Útiles", "Holgura"],
    vlsmRows,
    "compact",
  )}
  ${table(
    ["Métrica", "Valor", "Explicación"],
    [
      ["Direcciones de la base", n(vlsm.baseSize), "2^(32 − 24) = 256"],
      ["Asignadas", n(vlsm.assignedAddresses), "Suma de bloques /25 + /26 + /27 + /28"],
      ["Libres", n(vlsm.freeAddresses), "Bloque 192.168.0.240/28"],
      ["Hosts útiles", n(vlsm.usableAddresses), "126 + 62 + 30 + 14"],
      ["Red + broadcast", n(vlsm.reservedAddresses), "2 por subred"],
      ["Holgura", n(vlsm.slackAddresses), "Útiles − pedidos"],
      ["Aprovechamiento", `${vlsm.efficiency.toFixed(1)} %`, "Útiles / 256 × 100"],
    ],
    "compact",
  )}

  <h3>8.5 Caso campus (10.0.0.0/16)</h3>
  ${table(
    ["#", "Subred", "Pedidos", "Red / prefijo", "Máscara", "Útiles", "Holgura"],
    campusRows,
    "compact",
  )}
  <p class="caption">Cinco requerimientos de distinto tamaño; el algoritmo asigna /23, /24, /25, /26 y /27.</p>

  <h3>8.6 Caso límite: espacio insuficiente</h3>
  <div class="callout red">
    <p><strong>Entrada:</strong> 192.168.0.0/24 con A=200 y B=100.</p>
    <p><strong>Resultado:</strong> ${esc(data.insufficientSpace)}</p>
  </div>
  <p>La validación global se ejecuta antes de asignar direcciones, por lo que no se muestra una tabla parcial ni bloques solapados. El mensaje incluye la cantidad necesaria y un prefijo sugerido.</p>

  <h3>8.7 Pruebas de navegador</h3>
  <p>El script <span class="mono">scripts/qa.mjs</span> ejecuta 46 comprobaciones contra el sitio compilado. Todas pasaron y no se registraron errores de consola.</p>
  ${table(
    ["Bloque", "Comprobaciones", "Resultado"],
    [
      ["Inicio: título, opciones visibles y enlaces", "5", "Correcto"],
      ["CIDR /24: red, broadcast, rango, hosts, máscara, wildcard, clase, ámbito, subredes", "9", "Correcto"],
      ["CIDR /26: red, broadcast, rango, hosts, prefijo absorbido", "5", "Correcto"],
      ["Modo máscara decimal y error de máscara", "4", "Correcto"],
      ["Explorador de subredes y error de IP", "3", "Correcto"],
      ["VLSM caso PDF: métricas, filas y bloque libre", "12", "Correcto"],
      ["Preset campus", "2", "Correcto"],
      ["Estado vacío y error de espacio", "4", "Correcto"],
      ["Guía y consola sin errores", "2", "Correcto"],
      ["<strong>Total</strong>", "<strong>46</strong>", "<strong>46/46</strong>"],
    ],
    "compact",
  )}

  <h3>8.8 Reproducción</h3>
  <div class="tree">pnpm install
pnpm test
pnpm build
pnpm preview
node scripts/qa.mjs</div>
  <p>El QA requiere que el sitio esté servido en <span class="mono">http://127.0.0.1:4321</span> y que Chrome esté instalado. La ruta se puede cambiar con la variable <span class="mono">QA_CHROME</span>.</p>
</section>

<!-- ============================ 9. CONCLUSIONES ============================ -->
<section class="section">
  <h2><span class="num">09</span>Conclusiones y retroalimentación</h2>

  <h3>9.1 Conclusiones técnicas</h3>
  <ul>
    <li>Trabajar con enteros de 32 bits simplificó el cálculo y eliminó ambigüedades de formato; las operaciones de red quedaron como AND, suma y comparación.</li>
    <li>Separar la lógica de la interfaz permitió probar el algoritmo con 40 casos y reutilizarlo sin depender del DOM.</li>
    <li>El orden descendente de VLSM es la clave para evitar solapamientos: los bloques grandes se alinean primero y los pequeños reutilizan el espacio restante.</li>
    <li>La validación global antes de asignar evita resultados parciales y permite sugerir un prefijo mayor cuando la red base no alcanza.</li>
    <li>Mostrar el paso a paso, la holgura y el espacio libre convierte la herramienta en un apoyo de aprendizaje, no solo en una calculadora.</li>
  </ul>

  <h3>9.2 Retroalimentación del equipo</h3>
  <div class="grid2">${teamCards}</div>

  <h3>9.3 Limitaciones</h3>
  <ul>
    <li>El cálculo se enfoca en IPv4; IPv6 queda fuera del alcance del proyecto.</li>
    <li>La fórmula de hosts útiles usa el criterio clásico 2ⁿ − 2; para /31 se muestra la advertencia de la RFC 3021, pero no se contabilizan 2 hosts.</li>
    <li>No se valida que una subred esté realmente libre en una red en producción; la herramienta trabaja sobre el espacio teórico.</li>
    <li>No hay persistencia: al recargar la página se pierden los requerimientos capturados.</li>
  </ul>

  <div class="avoid">
    <h3>9.4 Trabajo futuro</h3>
    <ul>
      <li>Agregar IPv6 y cálculo de prefijos de 128 bits.</li>
      <li>Permitir guardar escenarios en el navegador (localStorage) y compartirlos por URL.</li>
      <li>Exportar el mapa de asignación como imagen o PDF.</li>
      <li>Incluir una calculadora inversa que, dada una lista de subredes existentes, detecte solapamientos.</li>
      <li>Publicar el sitio con un dominio propio y agregar ejemplos guiados interactivos.</li>
    </ul>

    <div class="callout green">
      <p class="quote">El proyecto nos dejó una lección clara: una buena herramienta de redes no solo debe dar el número correcto, también debe explicar cómo llegó a él y qué pasa cuando los datos no caben.</p>
    </div>
  </div>
</section>

<!-- ============================ 10. CHECKLIST ============================ -->
<section class="section">
  <h2><span class="num">10</span>Checklist de entrega y roles</h2>

  <h3>10.1 Checklist</h3>
  <ul class="checklist">
    <li>PDF del documento con portada, introducción, desarrollo, código, pruebas y conclusiones.</li>
    <li>ZIP con el código fuente, el sitio compilado y las instrucciones.</li>
    <li>Ejecutable web: carpeta <span class="mono">dist/</span> + <span class="mono">iniciar.bat</span>.</li>
    <li>Video <span class="mono">${esc(equipoSlug)}_CalculadoraIP.mp4</span> con la participación de los cuatro integrantes.</li>
    <li>README con pasos de instalación, ejecución y pruebas.</li>
    <li>Lista de integrantes y roles en la portada y en esta sección.</li>
    <li>Nombres de archivo: <span class="mono">${esc(equipoSlug)}_CalculadoraIP.pdf</span>, <span class="mono">.zip</span> y <span class="mono">.mp4</span>.</li>
  </ul>

  <h3>10.2 Roles del equipo</h3>
  ${table(
    ["Integrante", "Matrícula", "Rol", "Participación en el video"],
    config.integrantes.map((member) => [
      `<strong>${esc(member.nombre)}</strong>`,
      `<span class="mono">${esc(member.matricula)}</span>`,
      esc(member.rol),
      "Explicación técnica + demo",
    ]),
    "compact",
  )}

  <h3>10.3 Firmas</h3>
  <div class="sig">
    ${config.integrantes
      .map(
        (member) =>
          `<div><strong>${esc(member.nombre)}</strong><br />${esc(member.matricula)}<br />Firma electrónica</div>`,
      )
      .join("")}
  </div>

  <h3>10.4 Enlaces</h3>
  <ul>
    <li><strong>Repositorio:</strong> ${esc(config.repositorio)}</li>
    <li><strong>Documento:</strong> ${esc(equipoSlug)}_CalculadoraIP.pdf</li>
    <li><strong>Video:</strong> ${esc(equipoSlug)}_CalculadoraIP.mp4</li>
    <li><strong>Guion del video:</strong> docs/Guion_Video.md</li>
    <li><strong>Explicación extendida:</strong> docs/EXPLICACION_PROYECTO.md</li>
  </ul>
</section>

<!-- ============================ ANEXOS ============================ -->
<section class="section">
  <h2><span class="num">A</span>Anexo A: comandos rápidos</h2>
  <div class="tree">pnpm install          <span class="note"># dependencias</span>
pnpm dev              <span class="note"># desarrollo</span>
pnpm test             <span class="note"># 40 pruebas</span>
pnpm check            <span class="note"># tipos y plantillas</span>
pnpm build            <span class="note"># sitio estático en dist/</span>
pnpm preview          <span class="note"># vista previa del build</span>
pnpm serve            <span class="note"># servidor mínimo sin dependencias</span>
pnpm resultados       <span class="note"># datos del documento</span>
pnpm doc              <span class="note"># PDF</span>
pnpm empaquetar       <span class="note"># ZIP de entrega</span></div>

  <h2 style="margin-top:10mm"><span class="num">B</span>Anexo B: glosario</h2>
  ${table(
    ["Término", "Definición"],
    [
      ["CIDR", "Método de direccionamiento sin clases que usa un prefijo para indicar cuántos bits son de red."],
      ["Máscara", "Número de 32 bits con unos en la parte de red y ceros en la de host."],
      ["Prefijo", "Cantidad de bits de red; se escribe con una barra, por ejemplo /24."],
      ["Wildcard", "Máscara invertida; se usa para identificar la parte de host."],
      ["Red", "Primera dirección del bloque; se obtiene con IP AND máscara."],
      ["Broadcast", "Última dirección del bloque; se obtiene con red OR wildcard."],
      ["Host útil", "Dirección que se puede asignar a una interfaz; excluye red y broadcast."],
      ["VLSM", "Máscara variable: cada subred puede tener un prefijo distinto dentro de la misma red base."],
      ["Holgura", "Diferencia entre los hosts útiles del bloque y los hosts pedidos."],
      ["Bloque libre", "Espacio de la red base que no se asignó; se descompone en bloques CIDR alineados."],
      ["Aprovechamiento", "Porcentaje de direcciones de la base que quedan disponibles para hosts."],
    ],
    "compact",
  )}
</section>

</body>
</html>`;

await mkdir(path.join(ROOT, "docs"), { recursive: true });
await writeFile(outHtml, html, "utf8");

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true,
});

const page = await browser.newPage();
await page.goto(`file://${outHtml.replace(/\\/g, "/")}`, {
  waitUntil: "load",
});
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: outPdf,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  preferCSSPageSize: true,
  margin: { top: "17mm", bottom: "18mm", left: "16mm", right: "16mm" },
  headerTemplate: `<div></div>`,
  footerTemplate: `<div style="width:100%;height:100%;background:#ffffff;color:#5d6874;font-family:'Segoe UI',Arial,sans-serif;font-size:7px;display:flex;align-items:flex-end;justify-content:space-between;padding:0 16mm 5mm;box-sizing:border-box;">
    <span>${esc(config.equipo)} · Calculadora IP — CIDR y VLSM</span>
    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`,
});

await browser.close();
console.log(`PDF generado: ${outPdf}`);
