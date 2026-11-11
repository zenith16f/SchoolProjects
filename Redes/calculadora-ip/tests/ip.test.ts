import { describe, expect, it } from "vitest";
import {
  IpError,
  analyzeCidr,
  analyzeCidrFromValues,
  binaryGroups,
  formatIPv4,
  ipClass,
  ipScope,
  maskToPrefix,
  parseCidr,
  parseIPv4,
  parseMask,
  parsePrefix,
  prefixToMask,
  toBinaryString,
  totalAddresses,
  usableHosts,
} from "../src/lib/ip";

describe("parseIPv4 / formatIPv4", () => {
  it("convierte direcciones válidas en ambos sentidos", () => {
    expect(formatIPv4(parseIPv4("192.168.1.10"))).toBe("192.168.1.10");
    expect(formatIPv4(parseIPv4("0.0.0.0"))).toBe("0.0.0.0");
    expect(formatIPv4(parseIPv4("255.255.255.255"))).toBe(
      "255.255.255.255",
    );
    expect(parseIPv4("10.0.0.1")).toBe(167772161);
    expect(parseIPv4("255.255.255.255")).toBe(4294967295);
  });

  it("rechaza formatos inválidos con mensajes claros", () => {
    expect(() => parseIPv4("")).toThrow(IpError);
    expect(() => parseIPv4("192.168.1")).toThrow(/cuatro octetos/);
    expect(() => parseIPv4("192.168.1.256")).toThrow(/entre 0 y 255/);
    expect(() => parseIPv4("192.168.1.a")).toThrow(/solo puede contener dígitos/);
    expect(() => parseIPv4("192.168.01.1")).toThrow(/ceros a la izquierda/);
    expect(() => parseIPv4("192.168.1.1.1")).toThrow(/cuatro octetos/);
  });
});

describe("máscaras y prefijos", () => {
  it("convierte prefijos a máscaras", () => {
    expect(formatIPv4(prefixToMask(0))).toBe("0.0.0.0");
    expect(formatIPv4(prefixToMask(8))).toBe("255.0.0.0");
    expect(formatIPv4(prefixToMask(24))).toBe("255.255.255.0");
    expect(formatIPv4(prefixToMask(25))).toBe("255.255.255.128");
    expect(formatIPv4(prefixToMask(26))).toBe("255.255.255.192");
    expect(formatIPv4(prefixToMask(30))).toBe("255.255.255.252");
    expect(formatIPv4(prefixToMask(32))).toBe("255.255.255.255");
  });

  it("convierte máscaras a prefijos", () => {
    expect(maskToPrefix(parseIPv4("255.255.255.0"))).toBe(24);
    expect(maskToPrefix(parseIPv4("255.255.254.0"))).toBe(23);
    expect(maskToPrefix(parseIPv4("255.255.255.252"))).toBe(30);
    expect(maskToPrefix(parseIPv4("0.0.0.0"))).toBe(0);
    expect(maskToPrefix(parseIPv4("255.255.255.255"))).toBe(32);
  });

  it("rechaza máscaras no contiguas", () => {
    expect(() => parseMask("255.255.255.1")).toThrow(/no es contigua/);
    expect(() => parseMask("255.0.255.0")).toThrow(/no es contigua/);
  });

  it("acepta prefijos con o sin barra", () => {
    expect(parsePrefix("24")).toBe(24);
    expect(parsePrefix("/26")).toBe(26);
    expect(() => parsePrefix("33")).toThrow(/entre 0 y 32/);
    expect(() => parsePrefix("-1")).toThrow(IpError);
  });
});

describe("operaciones de red", () => {
  it("calcula totales y hosts utilizables", () => {
    expect(totalAddresses(24)).toBe(256);
    expect(totalAddresses(30)).toBe(4);
    expect(usableHosts(24)).toBe(254);
    expect(usableHosts(26)).toBe(62);
    expect(usableHosts(30)).toBe(2);
    expect(usableHosts(31)).toBe(0);
    expect(usableHosts(32)).toBe(0);
  });

  it("genera binario de 32 bits agrupado en octetos", () => {
    expect(toBinaryString(0)).toBe("0".repeat(32));
    expect(binaryGroups(parseIPv4("192.168.10.0"))).toEqual([
      "11000000",
      "10101000",
      "00001010",
      "00000000",
    ]);
  });

  it("clasifica clases y ámbitos", () => {
    expect(ipClass(parseIPv4("10.1.2.3")).letter).toBe("A");
    expect(ipClass(parseIPv4("172.16.0.1")).letter).toBe("B");
    expect(ipClass(parseIPv4("192.168.1.1")).letter).toBe("C");
    expect(ipClass(parseIPv4("224.0.0.1")).name).toBe("Multicast");
    expect(ipClass(parseIPv4("240.0.0.1")).letter).toBe("E");

    expect(ipScope(parseIPv4("192.168.1.1")).label).toBe("Privada");
    expect(ipScope(parseIPv4("10.1.2.3")).label).toBe("Privada");
    expect(ipScope(parseIPv4("172.20.0.1")).label).toBe("Privada");
    expect(ipScope(parseIPv4("8.8.8.8")).label).toBe("Pública");
    expect(ipScope(parseIPv4("127.0.0.1")).label).toBe("Loopback");
    expect(ipScope(parseIPv4("169.254.10.5")).label).toBe("Link-local");
    expect(ipScope(parseIPv4("224.0.0.1")).label).toBe("Multicast");
  });
});

describe("analyzeCidr", () => {
  it("resuelve el caso del PDF: 192.168.10.0/24", () => {
    const result = analyzeCidr("192.168.10.0/24");
    expect(result.networkText).toBe("192.168.10.0");
    expect(result.broadcastText).toBe("192.168.10.255");
    expect(result.firstHostText).toBe("192.168.10.1");
    expect(result.lastHostText).toBe("192.168.10.254");
    expect(result.maskText).toBe("255.255.255.0");
    expect(result.wildcardText).toBe("0.0.0.255");
    expect(result.totalAddresses).toBe(256);
    expect(result.usableHosts).toBe(254);
    expect(result.cidr).toBe("192.168.10.0/24");
    expect(result.ipClass.letter).toBe("C");
    expect(result.scope.label).toBe("Privada");
  });

  it("calcula la subred de una IP que no es dirección de red", () => {
    const result = analyzeCidr("192.168.10.130/26");
    expect(result.networkText).toBe("192.168.10.128");
    expect(result.broadcastText).toBe("192.168.10.191");
    expect(result.firstHostText).toBe("192.168.10.129");
    expect(result.lastHostText).toBe("192.168.10.190");
    expect(result.usableHosts).toBe(62);
    expect(result.networkBits).toBe(26);
    expect(result.hostBits).toBe(6);
  });

  it("maneja los casos especiales /31 y /32", () => {
    const p31 = analyzeCidr("10.0.0.0/31");
    expect(p31.usableHosts).toBe(0);
    expect(p31.firstHost).toBeNull();
    expect(p31.specialNote).toMatch(/RFC 3021/);

    const p32 = analyzeCidr("10.0.0.7/32");
    expect(p32.networkText).toBe("10.0.0.7");
    expect(p32.broadcastText).toBe("10.0.0.7");
    expect(p32.totalAddresses).toBe(1);
    expect(p32.specialNote).toMatch(/una sola dirección/);
  });

  it("produce bloques alineados para todos los prefijos", () => {
    const ip = parseIPv4("203.0.113.77");
    for (let prefix = 0; prefix <= 32; prefix += 1) {
      const result = analyzeCidrFromValues(ip, prefix);
      expect(result.network % result.totalAddresses).toBe(0);
      expect(result.network + result.totalAddresses - 1).toBe(result.broadcast);
      expect(result.network).toBeLessThanOrEqual(ip);
      expect(result.broadcast).toBeGreaterThanOrEqual(ip);
    }
  });

  it("valida la entrada CIDR", () => {
    expect(() => parseCidr("192.168.1.0")).toThrow(/dirección\/prefijo/);
    expect(() => parseCidr("192.168.1.0/33")).toThrow(/entre 0 y 32/);
    expect(() => analyzeCidr("192.168.1.0/24/1")).toThrow(IpError);
  });
});
