/**
 * Algoritmo VLSM (Variable Length Subnet Mask).
 *
 * Idea general:
 *   1. Ordenar las subredes de mayor a menor según los hosts que necesitan.
 *   2. Calcular a cada una la máscara más pequeña que la acomode.
 *   3. Asignar bloques contiguos desde el inicio de la red base.
 *
 * Al ordenar de mayor a menor, los bloques grandes quedan alineados y los
 * pequeños reutilizan el espacio restante sin solapamientos.
 */

import {
  IpError,
  assertPrefix,
  broadcastAddress,
  formatIPv4,
  networkAddress,
  parseIPv4,
  totalAddresses,
  usableHosts,
} from "./ip";
import {
  type FreeBlock,
  type SubnetBlock,
  freeBlocksBetween,
  makeSubnetBlock,
  prefixForHosts,
} from "./subnetting";

export interface VlsmRequirement {
  /** Identificador estable para la interfaz (no se usa en el cálculo). */
  id?: string;
  name: string;
  hosts: number;
}

export interface VlsmSubnet extends SubnetBlock {
  name: string;
  requestedHosts: number;
  blockSize: number;
  /** Hosts útiles que sobran: usableHosts − hosts solicitados. */
  waste: number;
  /** Direcciones no asignables del bloque (red + broadcast). */
  reserved: number;
}

export interface VlsmStep {
  order: number;
  name: string;
  requestedHosts: number;
  neededAddresses: number;
  prefix: number;
  blockSize: number;
  cidr: string;
}

export interface VlsmResult {
  baseIpText: string;
  baseNetworkText: string;
  basePrefix: number;
  baseCidr: string;
  baseSize: number;
  subnets: VlsmSubnet[];
  freeBlocks: FreeBlock[];
  freeAddresses: number;
  assignedAddresses: number;
  usableAddresses: number;
  requestedAddresses: number;
  reservedAddresses: number;
  slackAddresses: number;
  /** Porcentaje de direcciones de la base que quedan disponibles para hosts. */
  efficiency: number;
  steps: VlsmStep[];
}

/** Prefijo mínimo (red más grande) que podría contener `size` direcciones. */
function suggestedPrefixFor(size: number): number {
  let hostBits = 0;
  while (2 ** hostBits < size) {
    hostBits += 1;
  }
  return Math.max(0, 32 - hostBits);
}

/**
 * Ejecuta el algoritmo VLSM completo.
 *
 * @throws IpError con código INSUFFICIENT_SPACE cuando la red base no alcanza.
 */
export function calculateVlsm(
  baseIp: string,
  basePrefix: number,
  requirements: VlsmRequirement[],
): VlsmResult {
  const ip = parseIPv4(baseIp);
  assertPrefix(basePrefix);

  const baseNetwork = networkAddress(ip, basePrefix);
  const baseBroadcast = broadcastAddress(baseNetwork, basePrefix);
  const baseSize = totalAddresses(basePrefix);
  const baseNetworkText = formatIPv4(baseNetwork);
  const baseCidr = `${baseNetworkText}/${basePrefix}`;

  if (!Array.isArray(requirements) || requirements.length === 0) {
    throw new IpError(
      "EMPTY_REQUIREMENTS",
      "Agrega al menos una subred con su cantidad de hosts.",
    );
  }

  // Normalizar y validar cada requerimiento antes de asignar direcciones.
  const normalized = requirements.map((requirement, index) => {
    const name = String(requirement.name ?? "").trim();
    if (name.length === 0) {
      throw new IpError(
        "EMPTY_REQUIREMENTS",
        `La subred #${index + 1} necesita un nombre.`,
      );
    }

    if (!Number.isInteger(requirement.hosts) || requirement.hosts < 1) {
      throw new IpError(
        "INVALID_HOSTS",
        `«${name}» debe pedir una cantidad entera de hosts mayor o igual a 1.`,
      );
    }

    const prefix = prefixForHosts(requirement.hosts);
    if (prefix < basePrefix) {
      throw new IpError(
        "INSUFFICIENT_SPACE",
        `«${name}» necesita ${requirement.hosts} hosts (/${prefix}), pero la red base es /${basePrefix}. Usa una red base más grande.`,
      );
    }

    return {
      ...requirement,
      name,
      index,
      prefix,
      blockSize: totalAddresses(prefix),
      neededAddresses: requirement.hosts + 2,
    };
  });

  // Orden descendente por tamaño requerido; empate: orden de captura.
  const sorted = [...normalized].sort(
    (a, b) => b.neededAddresses - a.neededAddresses || a.index - b.index,
  );

  // Comprobación global: la suma de bloques no puede superar la red base.
  const requiredSize = sorted.reduce((sum, item) => sum + item.blockSize, 0);
  if (requiredSize > baseSize) {
    const suggested = suggestedPrefixFor(requiredSize);
    const suggestion =
      suggested < basePrefix
        ? ` Prueba con una red base /${suggested} o más grande.`
        : "";
    throw new IpError(
      "INSUFFICIENT_SPACE",
      `La red base ${baseCidr} tiene ${baseSize} direcciones, pero las subredes necesitan ${requiredSize}.${suggestion}`,
    );
  }

  let pointer = baseNetwork;
  const subnets: VlsmSubnet[] = [];

  sorted.forEach((requirement, order) => {
    // Salvaguarda: cada bloque debe caber y quedar alineado.
    if (pointer + requirement.blockSize - 1 > baseBroadcast) {
      throw new IpError(
        "INSUFFICIENT_SPACE",
        `No hay espacio suficiente para «${requirement.name}» dentro de ${baseCidr}.`,
      );
    }

    const block = makeSubnetBlock(pointer, requirement.prefix, order);
    const reserved = requirement.blockSize - usableHosts(requirement.prefix);

    subnets.push({
      ...block,
      name: requirement.name,
      requestedHosts: requirement.hosts,
      blockSize: requirement.blockSize,
      waste: block.usableHosts - requirement.hosts,
      reserved,
    });

    pointer += requirement.blockSize;
  });

  const assignedAddresses = subnets.reduce(
    (sum, subnet) => sum + subnet.blockSize,
    0,
  );
  const usableAddresses = subnets.reduce(
    (sum, subnet) => sum + subnet.usableHosts,
    0,
  );
  const requestedAddresses = subnets.reduce(
    (sum, subnet) => sum + subnet.requestedHosts,
    0,
  );
  const reservedAddresses = subnets.reduce(
    (sum, subnet) => sum + subnet.reserved,
    0,
  );
  const slackAddresses = subnets.reduce((sum, subnet) => sum + subnet.waste, 0);
  const freeAddresses = baseSize - assignedAddresses;

  return {
    baseIpText: formatIPv4(ip),
    baseNetworkText,
    basePrefix,
    baseCidr,
    baseSize,
    subnets,
    freeBlocks: freeBlocksBetween(pointer, baseBroadcast),
    freeAddresses,
    assignedAddresses,
    usableAddresses,
    requestedAddresses,
    reservedAddresses,
    slackAddresses,
    efficiency: (usableAddresses / baseSize) * 100,
    steps: subnets.map((subnet) => ({
      order: subnet.index + 1,
      name: subnet.name,
      requestedHosts: subnet.requestedHosts,
      neededAddresses: subnet.requestedHosts + 2,
      prefix: subnet.prefix,
      blockSize: subnet.blockSize,
      cidr: subnet.cidr,
    })),
  };
}
