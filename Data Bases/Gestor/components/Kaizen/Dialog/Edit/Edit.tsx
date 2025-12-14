"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateAccount } from "@/libs/actions/accounts";
import { updateOperation } from "@/libs/actions/operations";
import { updateCategory } from "@/libs/actions/tags";
import {
  getCategoryIcon,
  ICON_LABELS,
  IconName,
} from "@/libs/data/Icons/icons";
import { Categoria, Cuenta } from "@/libs/interfaces/AppInterfaces";
import { Banknote, CreditCard, Pencil, PiggyBank, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface OperacionData {
  idTransaccion: number;
  monto: number;
  descripcion: string;
  idCategoria: number;
  idCuenta: number;
  fecha: string;
  notas?: string | null;
}

interface EditOperationProps {
  operacion: OperacionData;
  categorias: Categoria[];
  cuentas: Cuenta[];
}

export function EditOperation({
  operacion,
  categorias,
  cuentas,
}: EditOperationProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Estado del formulario con valores iniciales
  const [selectedCategoria, setSelectedCategoria] = useState<string>(
    operacion.idCategoria.toString()
  );
  const [selectedCuenta, setSelectedCuenta] = useState<string>(
    operacion.idCuenta.toString()
  );
  const [monto, setMonto] = useState<string>(operacion.monto.toString());
  const [descripcion, setDescripcion] = useState<string>(operacion.descripcion);
  const [fecha, setFecha] = useState<string>(operacion.fecha);
  const [notas, setNotas] = useState<string>(operacion.notas || "");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateOperation(operacion.idTransaccion, formData);

      if (result.success) {
        toast.success("Operación actualizada exitosamente");
        setOpen(false);
        router.refresh();
      } else if (result.errors) {
        Object.values(result.errors)
          .flat()
          .forEach((error) => {
            toast.error(error);
          });
      } else {
        toast.error(result.error || "Error al actualizar la operación");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset a valores originales al cerrar
      setSelectedCategoria(operacion.idCategoria.toString());
      setSelectedCuenta(operacion.idCuenta.toString());
      setMonto(operacion.monto.toString());
      setDescripcion(operacion.descripcion);
      setFecha(operacion.fecha);
      setNotas(operacion.notas || "");
    }
  };

  // Agrupar categorías por tipo
  const categoriasIngreso = categorias.filter((c) => c.tipo === "ingreso");
  const categoriasEgreso = categorias.filter((c) => c.tipo === "egreso");

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Pencil className="w-4 h-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">
            Editar Operación
          </DialogTitle>
          <hr />
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="monto">Monto</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="monto"
                  name="monto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="pl-7"
                  required
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                name="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="idCategoria">Categoría</Label>
              <Select
                name="idCategoria"
                value={selectedCategoria}
                onValueChange={setSelectedCategoria}
                disabled={isPending}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {/* Ingresos */}
                  {categoriasIngreso.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-sm font-semibold text-gray-500">
                        Ingresos
                      </div>
                      {categoriasIngreso.map((categoria) => (
                        <SelectItem
                          key={categoria.idCategoria}
                          value={categoria.idCategoria.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="p-1 rounded"
                              style={{
                                backgroundColor: `${categoria.color}20`,
                              }}
                            >
                              {getCategoryIcon(
                                categoria.icono as IconName,
                                "w-4 h-4"
                              )}
                            </div>
                            <span>{categoria.nombre}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Egresos */}
                  {categoriasEgreso.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 border-t mt-1 pt-2">
                        Egresos
                      </div>
                      {categoriasEgreso.map((categoria) => (
                        <SelectItem
                          key={categoria.idCategoria}
                          value={categoria.idCategoria.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="p-1 rounded"
                              style={{
                                backgroundColor: `${categoria.color}20`,
                              }}
                            >
                              {getCategoryIcon(
                                categoria.icono as IconName,
                                "w-4 h-4"
                              )}
                            </div>
                            <span>{categoria.nombre}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Cuenta */}
            <div className="space-y-2">
              <Label htmlFor="idCuenta">Cuenta</Label>
              <Select
                name="idCuenta"
                value={selectedCuenta}
                onValueChange={setSelectedCuenta}
                disabled={isPending}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((cuenta) => (
                    <SelectItem
                      key={cuenta.idCuenta}
                      value={cuenta.idCuenta.toString()}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{cuenta.nombre}</span>
                        <span className="text-xs text-gray-500 ml-2 capitalize">
                          {cuenta.tipo}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                name="notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="cursor-pointer bg-black hover:bg-gray-800"
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
interface CategoriaData {
  idCategoria: number;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  icono: string;
  color: string;
}

interface EditTagProps {
  categoria: CategoriaData;
}

// Colores predefinidos
const PRESET_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#6B7280",
  "#14B8A6",
];

// Lista de iconos disponibles
const AVAILABLE_ICONS: IconName[] = [
  "dollar",
  "briefcase",
  "trending_up",
  "piggy_bank",
  "shopping_cart",
  "utensils",
  "coffee",
  "car",
  "bus",
  "home",
  "zap",
  "wrench",
  "tv",
  "gamepad",
  "ticket",
  "heart",
  "dumbbell",
  "book",
  "shopping_bag",
  "smartphone",
  "more_horizontal",
];

export function EditTag({ categoria }: EditTagProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Estado del formulario con valores iniciales
  const [nombre, setNombre] = useState<string>(categoria.nombre);
  const [descripcion, setDescripcion] = useState<string>(
    categoria.descripcion || ""
  );
  const [selectedIcono, setSelectedIcono] = useState<string>(categoria.icono);
  const [selectedColor, setSelectedColor] = useState<string>(categoria.color);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateCategory(categoria.idCategoria, formData);

      if (result.success) {
        toast.success("Categoría actualizada exitosamente");
        setOpen(false);
        router.refresh();
      } else if (result.errors) {
        Object.values(result.errors)
          .flat()
          .forEach((error) => {
            toast.error(error);
          });
      } else {
        toast.error(result.error || "Error al actualizar la categoría");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset a valores originales al cerrar
      setNombre(categoria.nombre);
      setDescripcion(categoria.descripcion || "");
      setSelectedIcono(categoria.icono);
      setSelectedColor(categoria.color);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Pencil className="w-4 h-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">
            Editar Categoría
          </DialogTitle>
          <hr />
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nombre de la Categoría */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Categoría</Label>
              <Input
                id="nombre"
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                disabled={isPending}
              />
            </div>

            {/* Selecciona un Icono */}
            <div className="space-y-2">
              <Label htmlFor="icono">Selecciona un Icono</Label>
              <Select
                name="icono"
                value={selectedIcono}
                onValueChange={setSelectedIcono}
                disabled={isPending}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un icono">
                    {selectedIcono && (
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(selectedIcono as IconName, "w-4 h-4")}
                        <span>{ICON_LABELS[selectedIcono as IconName]}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <SelectItem
                      key={iconName}
                      value={iconName}
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(iconName, "w-4 h-4")}
                        <span>{ICON_LABELS[iconName]}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selecciona un Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Selecciona un Color</Label>
              <div className="space-y-3">
                {/* Colores predefinidos */}
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        selectedColor === color
                          ? "border-black scale-110"
                          : "border-gray-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                      disabled={isPending}
                    />
                  ))}
                </div>

                {/* Color picker + input hex */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="w-10 h-10 rounded-md border-2 border-gray-300"
                      style={{ backgroundColor: selectedColor }}
                    />
                    <Input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      placeholder="#2C5F7C"
                      className="flex-1"
                      disabled={isPending}
                    />
                  </div>
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-16 h-10 cursor-pointer"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            {/* Información del tipo (solo lectura) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Tipo</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        categoria.tipo === "ingreso"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {categoria.tipo}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-right max-w-[150px]">
                  El tipo no se puede cambiar
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="cursor-pointer bg-black hover:bg-gray-800"
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CuentaData {
  idCuenta: number;
  nombre: string;
  tipo: string;
  saldoActual: number;
  moneda: string;
}

interface EditAccountProps {
  cuenta: CuentaData;
}

// Iconos para tipos de cuenta
const TIPO_CUENTA_CONFIG = {
  banco: {
    label: "Banco",
    icon: Wallet,
    color: "#3B82F6",
  },
  efectivo: {
    label: "Efectivo",
    icon: Banknote,
    color: "#10B981",
  },
  tarjeta_debito: {
    label: "Tarjeta de Débito",
    icon: CreditCard,
    color: "#8B5CF6",
  },
  tarjeta_credito: {
    label: "Tarjeta de Crédito",
    icon: CreditCard,
    color: "#EF4444",
  },
  ahorro: {
    label: "Ahorro",
    icon: PiggyBank,
    color: "#F59E0B",
  },
};

export function EditAccount({ cuenta }: EditAccountProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Estado del formulario con valores iniciales
  const [nombre, setNombre] = useState<string>(cuenta.nombre);
  const [selectedTipo, setSelectedTipo] = useState<string>(cuenta.tipo);
  const [saldoActual, setSaldoActual] = useState<string>(
    cuenta.saldoActual.toString()
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateAccount(cuenta.idCuenta, formData);

      if (result.success) {
        toast.success("Cuenta actualizada exitosamente");
        setOpen(false);
        router.refresh();
      } else if (result.errors) {
        Object.values(result.errors)
          .flat()
          .forEach((error) => {
            toast.error(error);
          });
      } else {
        toast.error(result.error || "Error al actualizar la cuenta");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset a valores originales al cerrar
      setNombre(cuenta.nombre);
      setSelectedTipo(cuenta.tipo);
      setSaldoActual(cuenta.saldoActual.toString());
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Pencil className="w-4 h-4" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">Editar Cuenta</DialogTitle>
          <hr />
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nombre de la Cuenta */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Cuenta</Label>
              <Input
                id="nombre"
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                disabled={isPending}
              />
            </div>

            {/* Tipo de Cuenta */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Cuenta</Label>
              <Select
                name="tipo"
                value={selectedTipo}
                onValueChange={setSelectedTipo}
                disabled={isPending}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_CUENTA_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem
                        key={key}
                        value={key}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1 rounded"
                            style={{ backgroundColor: `${config.color}20` }}
                          >
                            <Icon
                              className="w-4 h-4"
                              style={{ color: config.color }}
                            />
                          </div>
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Saldo Actual */}
            <div className="space-y-2">
              <Label htmlFor="saldoActual">Saldo Actual</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="saldoActual"
                  name="saldoActual"
                  type="number"
                  step="0.01"
                  value={saldoActual}
                  onChange={(e) => setSaldoActual(e.target.value)}
                  className="pl-7"
                  required
                  disabled={isPending}
                />
              </div>
              <p className="text-xs text-gray-500">
                Edita el saldo actual de la cuenta
              </p>
            </div>

            {/* Información de moneda (solo lectura) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Moneda</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {cuenta.moneda}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  La moneda no se puede cambiar
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={isPending}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="cursor-pointer bg-black hover:bg-gray-800"
              disabled={isPending}
            >
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
