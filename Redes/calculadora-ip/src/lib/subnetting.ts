/**
 * Utilidades de subnetting: calcular el prefijo necesario para cierta cantidad
 * de hosts, dividir una red en subredes iguales y descomponer el espacio libre.
 */

import {
  IpError,
  assertPrefix,
  broadcastAddress,
  formatIPv4,
  prefixToMask,
  totalAddresses,
  usableHosts,
  wildcardMask,
} from "./ip";

export interface SubnetBlock {
  index: number;
  prefix: number;
  network: number;
  broadcast: number;
  mask: number;
  wildcard: number;
  networkText: string;
  broadcastText: string;
  maskText: string;
  cidr: string;
  firstHost: number | null;
  lastHost: number | null;
  firstHostText: string | null;
  lastHostText: string | null;
  totalAddresses: number;
  usableHosts: number;
  hostBits: number;
}

export interface SubnetPlan {
  prefix: number;
  generated: number;
  blockSize: number;
  usableHosts: number;
  blocks: SubnetBlock[];
  truncated: boolean;
  requestedCount?: number;
  hostsPerSubnet?: number;
}

export interface FreeBlock {
  network: number;
  prefix: number;
  size: number;
  networkText: string;
  cidr: string;
}

/**
 * Calcula el prefijo más pequeño que acomoda `hosts` hosts útiles.
 *
 * Se suman 2 direcciones (red y broadcast) y se busca la potencia de dos
 * inmediata superior. Ejemplo: 100 hosts → 102 direcciones → 2^7 = 128 → /25.
 */
export function prefixForHosts(hosts: number): number {
  if (!Number.isInteger(hosts) || hosts < 1) {
    throw new IpError(
      "INVALID_HOSTS",
      "La cantidad de hosts debe ser un número entero mayor o igual a 1.",
    );
  }

  const needed = hosts + 2;
  let hostBits = 0;
  while (2 ** hostBits < needed) {
    hostBits += 1;
  }

  if (hostBits > 32) {
    throw new IpError(
      "INVALID_HOSTS",
      "La cantidad de hosts es demasiado grande para IPv4.",
    );
  }

  return 32 - hostBits;
}

/** Construye la información completa de un bloque de subred. */
export function makeSubnetBlock(
  network: number,
  prefix: number,
  index = 0,
): SubnetBlock {
  assertPrefix(prefix);
  const broadcast = broadcastAddress(network, prefix);
  const total = totalAddresses(prefix);
  const usable = usableHosts(prefix);
  const firstHost = usable > 0 ? network + 1 : null;
  const lastHost = usable > 0 ? broadcast - 1 : null;

  return {
    index,
    prefix,
    network,
    broadcast,
    mask: prefixToMask(prefix),
    wildcard: wildcardMask(prefix),
    networkText: formatIPv4(network),
    broadcastText: formatIPv4(broadcast),
    maskText: formatIPv4(prefixToMask(prefix)),
    cidr: `${formatIPv4(network)}/${prefix}`,
    firstHost,
    lastHost,
    firstHostText: firstHost === null ? null : formatIPv4(firstHost),
    lastHostText: lastHost === null ? null : formatIPv4(lastHost),
    totalAddresses: total,
    usableHosts: usable,
    hostBits: 32 - prefix,
  };
}

/**
 * Divide un bloque en subredes de prefijo fijo.
 *
 * `previewLimit` evita generar miles de filas en el navegador; el total real
 * se devuelve en `generated` y se marca `truncated` cuando solo se previsualiza
 * una parte.
 */
export function splitByPrefix(
  baseNetwork: number,
  basePrefix: number,
  newPrefix: number,
  previewLimit = 256,
): Omit<SubnetPlan, "requestedCount" | "hostsPerSubnet"> {
  assertPrefix(basePrefix);
  assertPrefix(newPrefix);

  if (newPrefix < basePrefix) {
    throw new IpError(
      "INVALID_PREFIX",
      `El nuevo prefijo /${newPrefix} debe ser mayor o igual al prefijo base /${basePrefix}.`,
    );
  }

  const generated = 2 ** (newPrefix - basePrefix);
  const limit = Math.max(0, Math.floor(previewLimit));
  const count = Math.min(generated, limit);
  const blockSize = totalAddresses(newPrefix);
  const blocks: SubnetBlock[] = [];

  for (let i = 0; i < count; i += 1) {
    blocks.push(makeSubnetBlock(baseNetwork + i * blockSize, newPrefix, i));
  }

  return {
    prefix: newPrefix,
    generated,
    blockSize,
    usableHosts: usableHosts(newPrefix),
    blocks,
    truncated: generated > count,
  };
}

/**
 * Plan de división a partir del número de subredes que se desean.
 * Si se piden 5 subredes se generan 8 (la siguiente potencia de dos).
 */
export function planBySubnetCount(
  baseNetwork: number,
  basePrefix: number,
  requestedCount: number,
  previewLimit = 256,
): SubnetPlan {
  if (!Number.isInteger(requestedCount) || requestedCount < 1) {
    throw new IpError(
      "INVALID_COUNT",
      "La cantidad de subredes debe ser un número entero mayor o igual a 1.",
    );
  }

  let bits = 0;
  while (2 ** bits < requestedCount) {
    bits += 1;
  }

  const newPrefix = basePrefix + bits;
  if (newPrefix > 32) {
    throw new IpError(
      "INVALID_COUNT",
      `No se pueden crear ${requestedCount} subredes dentro de una red /${basePrefix}: no quedan suficientes bits.`,
    );
  }

  return {
    ...splitByPrefix(baseNetwork, basePrefix, newPrefix, previewLimit),
    requestedCount,
  };
}

/**
 * Plan de división a partir de los hosts que debe tener cada subred.
 * Devuelve el prefijo calculado y cuántas subredes iguales caben en la base.
 */
export function planByHostsPerSubnet(
  baseNetwork: number,
  basePrefix: number,
  hostsPerSubnet: number,
  previewLimit = 256,
): SubnetPlan {
  const prefix = prefixForHosts(hostsPerSubnet);

  if (prefix < basePrefix) {
    throw new IpError(
      "INSUFFICIENT_SPACE",
      `Una subred para ${hostsPerSubnet} hosts necesita /${prefix}, pero la red base es /${basePrefix}. Usa una red base más grande.`,
    );
  }

  return {
    ...splitByPrefix(baseNetwork, basePrefix, prefix, previewLimit),
    hostsPerSubnet,
  };
}

/**
 * Descompone un rango libre [start, end] en bloques CIDR alineados.
 *
 * Se toma siempre el bloque más grande posible que empiece en la dirección
 * actual y que no se salga del rango. Así el espacio libre se muestra como
 * una lista de bloques reutilizables, no como una simple resta.
 */
export function freeBlocksBetween(start: number, end: number): FreeBlock[] {
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) {
    return [];
  }

  const blocks: FreeBlock[] = [];
  let address = start;

  while (address <= end) {
    const remaining = end - address + 1;
    let size = 1;

    // Duplicar mientras el bloque siga alineado y quepa en lo que resta.
    while (size * 2 <= remaining && address % (size * 2) === 0) {
      size *= 2;
    }

    const prefix = 32 - Math.round(Math.log2(size));
    blocks.push({
      network: address,
      prefix,
      size,
      networkText: formatIPv4(address),
      cidr: `${formatIPv4(address)}/${prefix}`,
    });

    address += size;
  }

  return blocks;
}
