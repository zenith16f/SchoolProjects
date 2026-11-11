/**
 * Genera docs/resultados.json y docs/resultados.csv a partir de la misma
 * librería que usa la aplicación. El documento PDF consume estos archivos,
 * así que los números del reporte siempre coinciden con los del sitio.
 *
 * Uso: pnpm resultados
 */
import { mkdir, writeFile } from "node:fs/promises";
import { analyzeCidr, type CidrAnalysis } from "../src/lib/ip";
import { calculateVlsm, type VlsmResult } from "../src/lib/vlsm";

interface CidrCase {
  input: string;
  label: string;
  analysis: CidrAnalysis;
}

const cidrInputs: Array<{ input: string; label: string }> = [
  { input: "192.168.10.0/24", label: "Red clase C típica" },
  { input: "172.16.5.130/26", label: "IP con host distinto de cero" },
  { input: "10.20.30.40/8", label: "Red privada grande" },
  { input: "203.0.113.0/30", label: "Enlace con 2 hosts" },
];

const cidrCases: CidrCase[] = cidrInputs.map((item) => ({
  ...item,
  analysis: analyzeCidr(item.input),
}));

const vlsmPdf = calculateVlsm("192.168.0.0", 24, [
  { name: "A", hosts: 100 },
  { name: "B", hosts: 50 },
  { name: "C", hosts: 25 },
  { name: "D", hosts: 10 },
]);

const vlsmCampus = calculateVlsm("10.0.0.0", 16, [
  { name: "Ventas", hosts: 500 },
  { name: "TI", hosts: 200 },
  { name: "Recursos Humanos", hosts: 100 },
  { name: "Almacén", hosts: 50 },
  { name: "Dirección", hosts: 20 },
]);

let insufficientSpace = "";
try {
  calculateVlsm("192.168.0.0", 24, [
    { name: "A", hosts: 200 },
    { name: "B", hosts: 100 },
  ]);
} catch (error) {
  insufficientSpace = error instanceof Error ? error.message : String(error);
}

const prefixes = [8, 16, 20, 24, 25, 26, 27, 28, 29, 30, 31, 32].map(
  (prefix) => {
    const data = analyzeCidr(`192.168.0.0/${prefix}`);
    return {
      prefix,
      mask: data.maskText,
      total: data.totalAddresses,
      usable: data.usableHosts,
      wildcard: data.wildcardText,
    };
  },
);

function csvCell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function vlsmCsv(result: VlsmResult): string {
  const header = [
    "#",
    "Subred",
    "Hosts pedidos",
    "Red",
    "Prefijo",
    "Máscara",
    "Primer host",
    "Último host",
    "Broadcast",
    "Hosts útiles",
    "Holgura",
  ];
  const rows = result.subnets.map((subnet, index) => [
    index + 1,
    subnet.name,
    subnet.requestedHosts,
    subnet.networkText,
    subnet.prefix,
    subnet.maskText,
    subnet.firstHostText ?? "",
    subnet.lastHostText ?? "",
    subnet.broadcastText,
    subnet.usableHosts,
    subnet.waste,
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => csvCell(cell)).join(","))
    .join("\r\n");
}

await mkdir("docs", { recursive: true });

const payload = {
  generado: new Date().toISOString(),
  cidrCases,
  vlsmPdf,
  vlsmCampus,
  insufficientSpace,
  prefixes,
};

await writeFile("docs/resultados.json", JSON.stringify(payload, null, 2), "utf8");
await writeFile(
  "docs/resultados-vlsm.csv",
  "\uFEFF" + vlsmCsv(vlsmPdf),
  "utf8",
);

console.log("docs/resultados.json y docs/resultados-vlsm.csv generados.");
console.log(
  `VLSM PDF: ${vlsmPdf.subnets.length} subredes, ${vlsmPdf.assignedAddresses}/${vlsmPdf.baseSize} asignadas, ${vlsmPdf.freeAddresses} libres.`,
);
console.log(`Error de espacio: ${insufficientSpace}`);
