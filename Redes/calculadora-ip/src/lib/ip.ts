/**
 * Núcleo de cálculo IPv4.
 *
 * Todas las direcciones se manejan internamente como enteros sin signo de
 * 32 bits (0 … 4 294 967 295). Trabajar con enteros evita errores al sumar
 * direcciones y hace que las operaciones de red sean simples operaciones
 * aritméticas y de bits.
 *
 * Este archivo NO toca el DOM: es lógica pura y por eso puede probarse con
 * Vitest y reutilizarse desde cualquier interfaz.
 */

export type IpErrorCode =
  | "INVALID_IP"
  | "INVALID_PREFIX"
  | "INVALID_MASK"
  | "INVALID_HOSTS"
  | "INVALID_COUNT"
  | "EMPTY_REQUIREMENTS"
  | "INSUFFICIENT_SPACE"
  | "TOO_MANY_SUBNETS";

/** Error de validación con un código estable, útil para las pruebas. */
export class IpError extends Error {
  readonly code: IpErrorCode;

  constructor(code: IpErrorCode, message: string) {
    super(message);
    this.name = "IpError";
    this.code = code;
  }
}

export type Tone = "blue" | "green" | "red" | "neutral";

export interface IpClass {
  letter: string;
  name: string;
  description: string;
}

export interface IpScope {
  label: string;
  tone: Tone;
  description: string;
}

export interface CidrAnalysis {
  ip: number;
  prefix: number;
  network: number;
  broadcast: number;
  firstHost: number | null;
  lastHost: number | null;
  mask: number;
  wildcard: number;
  totalAddresses: number;
  usableHosts: number;
  networkBits: number;
  hostBits: number;
  ipText: string;
  networkText: string;
  broadcastText: string;
  firstHostText: string | null;
  lastHostText: string | null;
  maskText: string;
  wildcardText: string;
  cidr: string;
  ipBinary: string;
  networkBinary: string;
  broadcastBinary: string;
  maskBinary: string;
  wildcardBinary: string;
  ipClass: IpClass;
  scope: IpScope;
  specialNote: string | null;
}

/* --------------------------------------------------------------------------
 * Conversiones básicas
 * ------------------------------------------------------------------------ */

/** Valida un prefijo CIDR (0–32). */
export function assertPrefix(prefix: number): void {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new IpError(
      "INVALID_PREFIX",
      "El prefijo debe ser un número entero entre 0 y 32.",
    );
  }
}

/**
 * Convierte "192.168.1.10" a su entero de 32 bits.
 * Rechaza octetos fuera de rango y ceros a la izquierda (evita ambigüedad octal).
 */
export function parseIPv4(input: string): number {
  const value = String(input ?? "").trim();
  if (value.length === 0) {
    throw new IpError("INVALID_IP", "Escribe una dirección IPv4.");
  }

  const parts = value.split(".");
  if (parts.length !== 4) {
    throw new IpError(
      "INVALID_IP",
      "La dirección debe tener cuatro octetos, por ejemplo 192.168.1.10.",
    );
  }

  let result = 0;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!/^\d{1,3}$/.test(part)) {
      throw new IpError(
        "INVALID_IP",
        `El octeto ${i + 1} ("${part}") solo puede contener dígitos.`,
      );
    }
    if (part.length > 1 && part.startsWith("0")) {
      throw new IpError(
        "INVALID_IP",
        `El octeto ${i + 1} ("${part}") no debe tener ceros a la izquierda.`,
      );
    }
    const octet = Number(part);
    if (octet < 0 || octet > 255) {
      throw new IpError(
        "INVALID_IP",
        `El octeto ${i + 1} ("${part}") debe estar entre 0 y 255.`,
      );
    }
    // Equivale a desplazar 8 bits, pero sin los problemas de signo de JS.
    result = result * 256 + octet;
  }

  return result;
}

/** Convierte un entero de 32 bits a notación decimal punteada. */
export function formatIPv4(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new IpError("INVALID_IP", "La dirección está fuera del rango IPv4.");
  }
  const a = Math.floor(value / 16777216) % 256;
  const b = Math.floor(value / 65536) % 256;
  const c = Math.floor(value / 256) % 256;
  const d = value % 256;
  return `${a}.${b}.${c}.${d}`;
}

/** Convierte una máscara decimal punteada (255.255.255.0) a prefijo (/24). */
export function maskToPrefix(mask: number): number {
  if (!Number.isInteger(mask) || mask < 0 || mask > 0xffffffff) {
    throw new IpError("INVALID_MASK", "La máscara no es una dirección válida.");
  }

  const inverted = (~mask) >>> 0;
  // En una máscara válida los unos son contiguos desde la izquierda, por lo
  // que su inverso debe ser de la forma 2^k - 1.
  if (inverted !== 0 && (inverted & (inverted + 1)) !== 0) {
    throw new IpError(
      "INVALID_MASK",
      "La máscara no es contigua. Ejemplos válidos: 255.255.255.0 o 255.255.254.0.",
    );
  }

  const hostBits = Math.round(Math.log2(inverted + 1));
  return 32 - hostBits;
}

/** Convierte un prefijo (/24) a máscara decimal punteada (255.255.255.0). */
export function prefixToMask(prefix: number): number {
  assertPrefix(prefix);
  if (prefix === 0) return 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

/** Parsea un prefijo escrito como "24" o "/24". */
export function parsePrefix(input: string | number): number {
  const raw = String(input).trim().replace(/^\//, "");
  if (!/^\d{1,2}$/.test(raw)) {
    throw new IpError(
      "INVALID_PREFIX",
      "El prefijo debe ser un número entero entre 0 y 32.",
    );
  }
  const prefix = Number(raw);
  assertPrefix(prefix);
  return prefix;
}

/** Parsea una máscara escrita en decimal punteado. */
export function parseMask(input: string): number {
  return maskToPrefix(parseIPv4(input));
}

/** Parsea una cadena CIDR completa, por ejemplo "192.168.1.0/24". */
export function parseCidr(input: string): { address: number; prefix: number } {
  const value = String(input ?? "").trim();
  const parts = value.split("/");
  if (parts.length !== 2) {
    throw new IpError(
      "INVALID_IP",
      "Usa el formato dirección/prefijo, por ejemplo 192.168.1.0/24.",
    );
  }
  return {
    address: parseIPv4(parts[0]),
    prefix: parsePrefix(parts[1]),
  };
}

/* --------------------------------------------------------------------------
 * Operaciones de red
 * ------------------------------------------------------------------------ */

/** Cantidad total de direcciones de un bloque (2^(32-prefijo)). */
export function totalAddresses(prefix: number): number {
  assertPrefix(prefix);
  return 2 ** (32 - prefix);
}

/**
 * Hosts utilizables con la fórmula clásica 2^n − 2.
 * Para /31 y /32 se devuelve 0: la calculadora usa el criterio visto en clase.
 */
export function usableHosts(prefix: number): number {
  assertPrefix(prefix);
  if (prefix >= 31) return 0;
  return 2 ** (32 - prefix) - 2;
}

/** Dirección de red: IP AND máscara. */
export function networkAddress(ip: number, prefix: number): number {
  return (ip & prefixToMask(prefix)) >>> 0;
}

/** Dirección de broadcast: red + tamaño del bloque − 1. */
export function broadcastAddress(network: number, prefix: number): number {
  return network + totalAddresses(prefix) - 1;
}

/** Máscara inversa (wildcard), usada por ACLs y protocolos de enrutamiento. */
export function wildcardMask(prefix: number): number {
  return totalAddresses(prefix) - 1;
}

/** Representa un entero como 32 caracteres binarios. */
export function toBinaryString(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new IpError("INVALID_IP", "La dirección está fuera del rango IPv4.");
  }
  return value.toString(2).padStart(32, "0");
}

/** Devuelve el binario agrupado en cuatro octetos. */
export function binaryGroups(value: number): string[] {
  return toBinaryString(value).match(/.{8}/g) ?? [];
}

/** Indica si una IP pertenece a un bloque dado. */
export function ipInBlock(ip: number, network: number, prefix: number): boolean {
  return networkAddress(ip, prefix) === network;
}

/** Clase histórica de la dirección (A–E), con notas de rangos especiales. */
export function ipClass(ip: number): IpClass {
  const firstOctet = Math.floor(ip / 16777216) % 256;

  if (firstOctet === 0) {
    return {
      letter: "—",
      name: "Reservada",
      description: "0.0.0.0/8 está reservado y no se asigna a hosts.",
    };
  }
  if (firstOctet === 127) {
    return {
      letter: "A",
      name: "Loopback",
      description: "127.0.0.0/8 se usa para pruebas locales (localhost).",
    };
  }
  if (firstOctet <= 127) {
    return {
      letter: "A",
      name: "Clase A",
      description: "Rango 1.0.0.0 – 127.255.255.255 (máscara por defecto /8).",
    };
  }
  if (firstOctet <= 191) {
    return {
      letter: "B",
      name: "Clase B",
      description: "Rango 128.0.0.0 – 191.255.255.255 (máscara por defecto /16).",
    };
  }
  if (firstOctet <= 223) {
    return {
      letter: "C",
      name: "Clase C",
      description: "Rango 192.0.0.0 – 223.255.255.255 (máscara por defecto /24).",
    };
  }
  if (firstOctet <= 239) {
    return {
      letter: "D",
      name: "Multicast",
      description: "Rango 224.0.0.0 – 239.255.255.255, reservado para multicast.",
    };
  }
  return {
    letter: "E",
    name: "Experimental",
    description: "Rango 240.0.0.0 – 255.255.255.255, reservado para uso futuro.",
  };
}

/** Clasifica el ámbito de la dirección: privada, pública o especial. */
export function ipScope(ip: number): IpScope {
  const checks: Array<{
    network: string;
    prefix: number;
    label: string;
    tone: Tone;
    description: string;
  }> = [
    {
      network: "0.0.0.0",
      prefix: 8,
      label: "Reservada",
      tone: "neutral",
      description: "0.0.0.0/8 no se asigna a interfaces de red.",
    },
    {
      network: "10.0.0.0",
      prefix: 8,
      label: "Privada",
      tone: "green",
      description: "Rango privado 10.0.0.0/8 (RFC 1918).",
    },
    {
      network: "100.64.0.0",
      prefix: 10,
      label: "CGNAT",
      tone: "neutral",
      description: "Espacio compartido por operadores (RFC 6598).",
    },
    {
      network: "127.0.0.0",
      prefix: 8,
      label: "Loopback",
      tone: "neutral",
      description: "127.0.0.0/8 apunta al propio equipo.",
    },
    {
      network: "169.254.0.0",
      prefix: 16,
      label: "Link-local",
      tone: "neutral",
      description: "169.254.0.0/16 se autoconfigura sin DHCP (APIPA).",
    },
    {
      network: "172.16.0.0",
      prefix: 12,
      label: "Privada",
      tone: "green",
      description: "Rango privado 172.16.0.0/12 (RFC 1918).",
    },
    {
      network: "192.0.2.0",
      prefix: 24,
      label: "Documentación",
      tone: "neutral",
      description: "192.0.2.0/24 es TEST-NET-1, para ejemplos y documentación.",
    },
    {
      network: "192.168.0.0",
      prefix: 16,
      label: "Privada",
      tone: "green",
      description: "Rango privado 192.168.0.0/16 (RFC 1918).",
    },
    {
      network: "198.18.0.0",
      prefix: 15,
      label: "Benchmark",
      tone: "neutral",
      description: "198.18.0.0/15 se usa en pruebas de rendimiento.",
    },
    {
      network: "198.51.100.0",
      prefix: 24,
      label: "Documentación",
      tone: "neutral",
      description: "198.51.100.0/24 es TEST-NET-2, para ejemplos y documentación.",
    },
    {
      network: "203.0.113.0",
      prefix: 24,
      label: "Documentación",
      tone: "neutral",
      description: "203.0.113.0/24 es TEST-NET-3, para ejemplos y documentación.",
    },
    {
      network: "224.0.0.0",
      prefix: 4,
      label: "Multicast",
      tone: "red",
      description: "224.0.0.0/4 se reserva para tráfico multicast.",
    },
    {
      network: "240.0.0.0",
      prefix: 4,
      label: "Reservada",
      tone: "red",
      description: "240.0.0.0/4 está reservado; no se asigna a hosts.",
    },
  ];

  for (const check of checks) {
    const network = parseIPv4(check.network);
    if (ipInBlock(ip, network, check.prefix)) {
      return {
        label: check.label,
        tone: check.tone,
        description: check.description,
      };
    }
  }

  return {
    label: "Pública",
    tone: "blue",
    description: "Dirección enrutable en Internet (no pertenece a un rango privado).",
  };
}

/* --------------------------------------------------------------------------
 * Análisis completo de una red CIDR
 * ------------------------------------------------------------------------ */

/** Analiza una IP y un prefijo y devuelve todos los datos de la subred. */
export function analyzeCidrFromValues(ip: number, prefix: number): CidrAnalysis {
  assertPrefix(prefix);
  if (!Number.isInteger(ip) || ip < 0 || ip > 0xffffffff) {
    throw new IpError("INVALID_IP", "La dirección está fuera del rango IPv4.");
  }

  const network = networkAddress(ip, prefix);
  const broadcast = broadcastAddress(network, prefix);
  const total = totalAddresses(prefix);
  const usable = usableHosts(prefix);
  const firstHost = usable > 0 ? network + 1 : null;
  const lastHost = usable > 0 ? broadcast - 1 : null;
  const mask = prefixToMask(prefix);
  const wildcard = wildcardMask(prefix);

  let specialNote: string | null = null;
  if (prefix === 32) {
    specialNote =
      "Con /32 el bloque tiene una sola dirección: se usa para rutas a un host y no separa red de broadcast.";
  } else if (prefix === 31) {
    specialNote =
      "Con /31 hay 2 direcciones. La fórmula 2^n − 2 da 0 hosts; la RFC 3021 permite usar ambas en enlaces punto a punto.";
  } else if (prefix === 0) {
    specialNote =
      "Con /0 la máscara es 0.0.0.0 y el bloque abarca todo el espacio IPv4.";
  }

  return {
    ip,
    prefix,
    network,
    broadcast,
    firstHost,
    lastHost,
    mask,
    wildcard,
    totalAddresses: total,
    usableHosts: usable,
    networkBits: prefix,
    hostBits: 32 - prefix,
    ipText: formatIPv4(ip),
    networkText: formatIPv4(network),
    broadcastText: formatIPv4(broadcast),
    firstHostText: firstHost === null ? null : formatIPv4(firstHost),
    lastHostText: lastHost === null ? null : formatIPv4(lastHost),
    maskText: formatIPv4(mask),
    wildcardText: formatIPv4(wildcard),
    cidr: `${formatIPv4(network)}/${prefix}`,
    ipBinary: toBinaryString(ip),
    networkBinary: toBinaryString(network),
    broadcastBinary: toBinaryString(broadcast),
    maskBinary: toBinaryString(mask),
    wildcardBinary: toBinaryString(wildcard),
    ipClass: ipClass(ip),
    scope: ipScope(ip),
    specialNote,
  };
}

/** Analiza una cadena CIDR completa ("10.0.0.0/8"). */
export function analyzeCidr(input: string): CidrAnalysis {
  const { address, prefix } = parseCidr(input);
  return analyzeCidrFromValues(address, prefix);
}
