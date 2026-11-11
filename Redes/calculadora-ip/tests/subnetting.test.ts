import { describe, expect, it } from "vitest";
import { IpError, parseIPv4 } from "../src/lib/ip";
import {
  freeBlocksBetween,
  makeSubnetBlock,
  planByHostsPerSubnet,
  planBySubnetCount,
  prefixForHosts,
  splitByPrefix,
} from "../src/lib/subnetting";

describe("prefixForHosts", () => {
  it("elige la máscara más pequeña que acomoda los hosts", () => {
    expect(prefixForHosts(1)).toBe(30);
    expect(prefixForHosts(2)).toBe(30);
    expect(prefixForHosts(3)).toBe(29);
    expect(prefixForHosts(10)).toBe(28);
    expect(prefixForHosts(25)).toBe(27);
    expect(prefixForHosts(50)).toBe(26);
    expect(prefixForHosts(100)).toBe(25);
    expect(prefixForHosts(126)).toBe(25);
    expect(prefixForHosts(127)).toBe(24);
    expect(prefixForHosts(254)).toBe(24);
    expect(prefixForHosts(255)).toBe(23);
  });

  it("rechaza cantidades inválidas", () => {
    expect(() => prefixForHosts(0)).toThrow(IpError);
    expect(() => prefixForHosts(-5)).toThrow(/mayor o igual a 1/);
    expect(() => prefixForHosts(1.5)).toThrow(/entero/);
    expect(() => prefixForHosts(4294967295)).toThrow(/demasiado grande/);
  });
});

describe("splitByPrefix", () => {
  it("divide 192.168.0.0/24 en cuatro /26 contiguos", () => {
    const plan = splitByPrefix(parseIPv4("192.168.0.0"), 24, 26);
    expect(plan.generated).toBe(4);
    expect(plan.truncated).toBe(false);
    expect(plan.blocks).toHaveLength(4);
    expect(plan.blocks[0].cidr).toBe("192.168.0.0/26");
    expect(plan.blocks[0].broadcastText).toBe("192.168.0.63");
    expect(plan.blocks[0].usableHosts).toBe(62);
    expect(plan.blocks[1].cidr).toBe("192.168.0.64/26");
    expect(plan.blocks[3].cidr).toBe("192.168.0.192/26");
    expect(plan.blocks[3].broadcastText).toBe("192.168.0.255");

    for (let i = 1; i < plan.blocks.length; i += 1) {
      expect(plan.blocks[i].network).toBe(plan.blocks[i - 1].broadcast + 1);
    }
  });

  it("limita la previsualización sin perder el total", () => {
    const plan = splitByPrefix(parseIPv4("10.0.0.0"), 16, 24, 10);
    expect(plan.generated).toBe(256);
    expect(plan.blocks).toHaveLength(10);
    expect(plan.truncated).toBe(true);
  });

  it("rechaza un prefijo menor al de la base", () => {
    expect(() => splitByPrefix(parseIPv4("10.0.0.0"), 24, 16)).toThrow(
      /mayor o igual/,
    );
  });
});

describe("planBySubnetCount", () => {
  it("redondea a la siguiente potencia de dos", () => {
    const four = planBySubnetCount(parseIPv4("192.168.0.0"), 24, 4);
    expect(four.prefix).toBe(26);
    expect(four.generated).toBe(4);
    expect(four.requestedCount).toBe(4);

    const five = planBySubnetCount(parseIPv4("192.168.0.0"), 24, 5);
    expect(five.prefix).toBe(27);
    expect(five.generated).toBe(8);
    expect(five.blocks).toHaveLength(8);
    expect(five.blocks[7].broadcastText).toBe("192.168.0.255");
  });

  it("falla si no quedan bits suficientes", () => {
    expect(() => planBySubnetCount(parseIPv4("10.0.0.0"), 30, 8)).toThrow(
      /no quedan suficientes bits/,
    );
    expect(() => planBySubnetCount(parseIPv4("10.0.0.0"), 24, 0)).toThrow(
      IpError,
    );
  });
});

describe("planByHostsPerSubnet", () => {
  it("calcula el prefijo y cuántas subredes caben", () => {
    const plan = planByHostsPerSubnet(parseIPv4("192.168.0.0"), 24, 50);
    expect(plan.prefix).toBe(26);
    expect(plan.generated).toBe(4);
    expect(plan.usableHosts).toBe(62);
    expect(plan.hostsPerSubnet).toBe(50);
    expect(plan.blocks[0].firstHostText).toBe("192.168.0.1");
  });

  it("falla si la red base es más pequeña que la subred pedida", () => {
    expect(() => planByHostsPerSubnet(parseIPv4("192.168.0.0"), 24, 500)).toThrow(
      /necesita \/23/,
    );
  });
});

describe("freeBlocksBetween", () => {
  it("descompone el espacio libre en bloques alineados", () => {
    expect(freeBlocksBetween(parseIPv4("192.168.0.240"), parseIPv4("192.168.0.255"))).toEqual([
      expect.objectContaining({ cidr: "192.168.0.240/28", size: 16 }),
    ]);

    const blocks = freeBlocksBetween(
      parseIPv4("192.168.0.128"),
      parseIPv4("192.168.0.239"),
    );
    expect(blocks.map((block) => block.cidr)).toEqual([
      "192.168.0.128/26",
      "192.168.0.192/27",
      "192.168.0.224/28",
    ]);
    expect(blocks.reduce((sum, block) => sum + block.size, 0)).toBe(112);
  });

  it("devuelve un bloque completo cuando todo está libre", () => {
    const blocks = freeBlocksBetween(parseIPv4("10.0.0.0"), parseIPv4("10.0.0.255"));
    expect(blocks).toHaveLength(1);
    expect(blocks[0].cidr).toBe("10.0.0.0/24");
  });

  it("devuelve una lista vacía si el rango no es válido", () => {
    expect(freeBlocksBetween(10, 5)).toEqual([]);
  });
});

describe("makeSubnetBlock", () => {
  it("incluye todos los datos de la subred", () => {
    const block = makeSubnetBlock(parseIPv4("172.16.5.64"), 28, 2);
    expect(block.cidr).toBe("172.16.5.64/28");
    expect(block.broadcastText).toBe("172.16.5.79");
    expect(block.maskText).toBe("255.255.255.240");
    expect(block.firstHostText).toBe("172.16.5.65");
    expect(block.lastHostText).toBe("172.16.5.78");
    expect(block.usableHosts).toBe(14);
    expect(block.index).toBe(2);
  });
});
