import { describe, expect, it } from "vitest";
import { IpError, parseIPv4 } from "../src/lib/ip";
import { calculateVlsm } from "../src/lib/vlsm";

describe("calculateVlsm — caso del PDF", () => {
  const result = calculateVlsm("192.168.0.0", 24, [
    { name: "A", hosts: 100 },
    { name: "B", hosts: 50 },
    { name: "C", hosts: 25 },
    { name: "D", hosts: 10 },
  ]);

  it("ordena y asigna bloques contiguos de mayor a menor", () => {
    expect(result.subnets.map((subnet) => subnet.name)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
    expect(result.subnets.map((subnet) => subnet.cidr)).toEqual([
      "192.168.0.0/25",
      "192.168.0.128/26",
      "192.168.0.192/27",
      "192.168.0.224/28",
    ]);
    expect(result.subnets.map((subnet) => subnet.broadcastText)).toEqual([
      "192.168.0.127",
      "192.168.0.191",
      "192.168.0.223",
      "192.168.0.239",
    ]);
  });

  it("calcula hosts útiles, desperdicio y direcciones reservadas", () => {
    expect(result.subnets.map((subnet) => subnet.usableHosts)).toEqual([
      126, 62, 30, 14,
    ]);
    expect(result.subnets.map((subnet) => subnet.waste)).toEqual([26, 12, 5, 4]);
    expect(result.subnets.map((subnet) => subnet.reserved)).toEqual([2, 2, 2, 2]);
    expect(result.subnets[0].requestedHosts).toBe(100);
    expect(result.subnets[0].firstHostText).toBe("192.168.0.1");
    expect(result.subnets[0].lastHostText).toBe("192.168.0.126");
  });

  it("no produce solapamientos y respeta la red base", () => {
    for (let i = 1; i < result.subnets.length; i += 1) {
      expect(result.subnets[i].network).toBe(
        result.subnets[i - 1].broadcast + 1,
      );
    }
    const baseStart = parseIPv4(result.baseNetworkText);
    const baseEnd = baseStart + result.baseSize - 1;
    expect(result.subnets[0].network).toBe(baseStart);
    expect(result.subnets.at(-1)!.broadcast).toBeLessThanOrEqual(baseEnd);
  });

  it("resume el espacio libre y el aprovechamiento", () => {
    expect(result.baseCidr).toBe("192.168.0.0/24");
    expect(result.baseSize).toBe(256);
    expect(result.assignedAddresses).toBe(240);
    expect(result.freeAddresses).toBe(16);
    expect(result.usableAddresses).toBe(232);
    expect(result.requestedAddresses).toBe(185);
    expect(result.reservedAddresses).toBe(8);
    expect(result.slackAddresses).toBe(47);
    expect(result.efficiency).toBeCloseTo(90.625, 3);
    expect(result.freeBlocks).toHaveLength(1);
    expect(result.freeBlocks[0].cidr).toBe("192.168.0.240/28");
  });

  it("genera los pasos del algoritmo", () => {
    expect(result.steps).toHaveLength(4);
    expect(result.steps[0]).toEqual({
      order: 1,
      name: "A",
      requestedHosts: 100,
      neededAddresses: 102,
      prefix: 25,
      blockSize: 128,
      cidr: "192.168.0.0/25",
    });
  });
});

describe("calculateVlsm — orden de entrada y casos adicionales", () => {
  it("ordena aunque la entrada venga desordenada", () => {
    const result = calculateVlsm("192.168.0.0", 24, [
      { name: "C", hosts: 25 },
      { name: "A", hosts: 100 },
      { name: "D", hosts: 10 },
      { name: "B", hosts: 50 },
    ]);
    expect(result.subnets.map((subnet) => subnet.name)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
    expect(result.subnets[0].cidr).toBe("192.168.0.0/25");
  });

  it("reparte una red /16 entre cinco departamentos", () => {
    const result = calculateVlsm("10.0.0.0", 16, [
      { name: "Ventas", hosts: 500 },
      { name: "TI", hosts: 200 },
      { name: "RH", hosts: 100 },
      { name: "Almacén", hosts: 50 },
      { name: "Dirección", hosts: 20 },
    ]);
    expect(result.subnets.map((subnet) => subnet.cidr)).toEqual([
      "10.0.0.0/23",
      "10.0.2.0/24",
      "10.0.3.0/25",
      "10.0.3.128/26",
      "10.0.3.192/27",
    ]);
    expect(result.assignedAddresses).toBe(992);
    expect(result.freeAddresses).toBe(65536 - 992);
    expect(result.freeBlocks[0].cidr).toBe("10.0.3.224/27");
    expect(
      result.freeBlocks.reduce((sum, block) => sum + block.size, 0),
    ).toBe(result.freeAddresses);
  });

  it("mantiene el orden de entrada cuando hay empate", () => {
    const result = calculateVlsm("10.0.0.0", 24, [
      { name: "Primera", hosts: 10 },
      { name: "Segunda", hosts: 10 },
    ]);
    expect(result.subnets.map((subnet) => subnet.name)).toEqual([
      "Primera",
      "Segunda",
    ]);
  });

  it("acomoda una sola subred con 1 host en /30", () => {
    const result = calculateVlsm("192.168.1.0", 24, [
      { name: "Enlace", hosts: 1 },
    ]);
    expect(result.subnets[0].prefix).toBe(30);
    expect(result.subnets[0].usableHosts).toBe(2);
    expect(result.subnets[0].waste).toBe(1);
    expect(result.freeAddresses).toBe(252);
  });
});

describe("calculateVlsm — errores", () => {
  it("falla cuando la red base no tiene espacio suficiente", () => {
    try {
      calculateVlsm("192.168.0.0", 24, [
        { name: "Grande", hosts: 200 },
        { name: "Mediana", hosts: 100 },
      ]);
      throw new Error("La prueba debió lanzar un error");
    } catch (error) {
      expect(error).toBeInstanceOf(IpError);
      expect((error as IpError).code).toBe("INSUFFICIENT_SPACE");
      expect((error as IpError).message).toMatch(/256 direcciones/);
      expect((error as IpError).message).toMatch(/\/23/);
    }
  });

  it("falla si una subred no cabe ni siquiera sola en la base", () => {
    expect(() =>
      calculateVlsm("192.168.0.0", 26, [{ name: "A", hosts: 100 }]),
    ).toThrow(/necesita 100 hosts \(\/25\)/);
  });

  it("valida lista vacía, nombres y hosts", () => {
    expect(() => calculateVlsm("10.0.0.0", 8, [])).toThrow(
      /al menos una subred/,
    );
    expect(() =>
      calculateVlsm("10.0.0.0", 8, [{ name: "  ", hosts: 10 }]),
    ).toThrow(/necesita un nombre/);
    expect(() =>
      calculateVlsm("10.0.0.0", 8, [{ name: "A", hosts: 0 }]),
    ).toThrow(/mayor o igual a 1/);
    expect(() =>
      calculateVlsm("10.0.0.0", 8, [{ name: "A", hosts: 1.5 }]),
    ).toThrow(/entera/);
  });

  it("valida la dirección y el prefijo base", () => {
    expect(() =>
      calculateVlsm("10.0.0.999", 8, [{ name: "A", hosts: 10 }]),
    ).toThrow(/entre 0 y 255/);
    expect(() =>
      calculateVlsm("10.0.0.0", 33, [{ name: "A", hosts: 10 }]),
    ).toThrow(/entre 0 y 32/);
  });
});
