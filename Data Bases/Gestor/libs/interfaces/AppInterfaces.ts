import { IconName } from "../data/Icons/icons";
import { Moneda, TipoCuenta, TipoTransaccion } from "../types/AppTypes";

export interface Usuario {
  idUsuario: number;
  username: string;
  email: string;
  activo: boolean;
}

export interface Operacion {
  idTransaccion: number;
  idUsuario: number;
  idCuenta: number;
  idCategoria: number;
  monto: number;
  descripcion: string;
  fecha: string;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OperacionRelaciones {
  idTransaccion: number;
  idUsuario: number;
  idCuenta: number;
  idCategoria: number;
  monto: number;
  descripcion: string;
  fecha: string;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
  categoria: {
    idCategoria: number;
    nombre: string;
    tipo: TipoTransaccion;
    icono: IconName;
    color: string;
  };
  cuenta: {
    idCuenta: number;
    nombre: string;
    tipo: TipoCuenta;
    saldoInicial: number;
    saldoActual: number;
    moneda: Moneda;
  };
}

export interface Categoria {
  idCategoria: number;
  idUsuario: number;
  nombre: string;
  tipo: TipoTransaccion;
  descripcion: string | null;
  color: string;
  icono: IconName;
  activa: boolean;
}

export interface Cuenta {
  idCuenta: number;
  idUsuario: number;
  nombre: string;
  tipo: TipoCuenta;
  saldoInicial: number;
  saldoActual: number;
  moneda: Moneda;
  activa: boolean;
  fechaCreacion: string;
}

export interface CuentaConOperaciones extends Cuenta {
  transacciones: Operacion[];
}

export interface CategoriaConOperaciones extends Categoria {
  transacciones: Operacion[];
}

export interface CreateCuentaDTO {
  idUsuario: number;
  nombre: string;
  tipo: TipoCuenta;
  saldoInicial: number;
  moneda: Moneda;
}

export interface CreateOperacionDTO {
  idUsuario: number;
  idCuenta: number;
  idCategoria: number;
  monto: number;
  descripcion: string;
  fecha: string;
  notas?: string;
}

export interface UpdateCategoriaDTO {
  nombre?: string;
  tipo?: TipoTransaccion;
  descripcion?: string;
  color?: string;
  icono?: IconName;
  activa?: boolean;
}

export interface UpdateCuentaDTO {
  nombre?: string;
  tipo?: TipoCuenta;
  saldoInicial?: number;
  activa?: boolean;
}

export interface UpdateOperacionDTO {
  idCuenta?: number;
  idCategoria?: number;
  monto?: number;
  descripcion?: string;
  fecha?: string;
  notas?: string;
}
