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
import { createAccount } from "@/libs/actions/accounts";
import { createOperation } from "@/libs/actions/operations";
import { createCategory } from "@/libs/actions/tags";
import {
  getCategoryIcon,
  ICON_LABELS,
  IconName,
} from "@/libs/data/Icons/icons";
import { Categoria, Cuenta } from "@/libs/interfaces/AppInterfaces";
import { Banknote, CreditCard, PiggyBank, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface AddOperationProps {
  categorias: Categoria[];
  cuentas: Cuenta[];
}

export function AddOperation({ categorias, cuentas }: AddOperationProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Estado del formulario
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [selectedCuenta, setSelectedCuenta] = useState<string>("");
  const [fecha, setFecha] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createOperation(formData);

      if (result.success) {
        toast.success("Operación creada exitosamente");
        setOpen(false);

        // Reset form
        setSelectedCategoria("");
        setSelectedCuenta("");
        setFecha(new Date().toISOString().split("T")[0]);

        router.refresh();
      } else if (result.errors) {
        // Mostrar errores de validación
        Object.values(result.errors)
          .flat()
          .forEach((error) => {
            toast.error(error as string);
          });
      } else {
        toast.error(result.error || "Error al crear la operación");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset al cerrar
      setSelectedCategoria("");
      setSelectedCuenta("");
      setFecha(new Date().toISOString().split("T")[0]);
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
        <Button className="cursor-pointer">Añadir Operación</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">
            Nueva Operación
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
                  placeholder="0.00"
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
                placeholder="Ej: Compra en supermercado"
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
                      <div className="flex items-center gap-2 justify-between w-full">
                        <span>{cuenta.nombre}</span>
                        <span className="text-xs text-gray-500 capitalize">
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

            {/* Notas (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas (Opcional)</Label>
              <Textarea
                id="notas"
                name="notas"
                placeholder="Agrega notas adicionales..."
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

interface AddTagProps {
  idUsuario: number;
}

// Colores predefinidos comunes
const PRESET_COLORS = [
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // green
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#6B7280", // gray
  "#14B8A6", // teal
];

// Lista de iconos disponibles (del enum de Prisma)
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

export function AddTag({ idUsuario }: AddTagProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Estado del formulario
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [selectedIcono, setSelectedIcono] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("#6B7280");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createCategory(idUsuario, formData);

      if (result.success) {
        toast.success("Categoría creada exitosamente");
        setOpen(false);

        // Reset form
        setSelectedTipo("");
        setSelectedIcono("");
        setSelectedColor("#6B7280");

        router.refresh();
      } else if (result.errors) {
        // Mostrar errores de validación
        Object.values(result.errors)
          .flat()
          .forEach((error) => {
            toast.error(error as string);
          });
      } else {
        toast.error(result.error || "Error al crear la categoría");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset al cerrar
      setSelectedTipo("");
      setSelectedIcono("");
      setSelectedColor("#6B7280");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">Añadir Categoría</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">
            Nueva Categoría
          </DialogTitle>
          <hr />
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej: Alimentación"
                required
                disabled={isPending}
              />
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
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
                  <SelectItem value="ingreso">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>Ingreso</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="egreso">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Egreso</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Icono */}
            <div className="space-y-2">
              <Label htmlFor="icono">Icono</Label>
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

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
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

                {/* Color picker manual */}
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                    disabled={isPending}
                  />
                  <Input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    placeholder="#6B7280"
                    className="flex-1"
                    disabled={isPending}
                  />
                </div>

                {/* Preview */}
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${selectedColor}20` }}
                  >
                    {selectedIcono ? (
                      getCategoryIcon(selectedIcono as IconName, "w-6 h-6")
                    ) : (
                      <div className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-sm text-gray-600">Vista previa</span>
                </div>
              </div>
            </div>

            {/* Descripción (Opcional) */}
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (Opcional)</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                placeholder="Agrega una descripción..."
                rows={3}
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 ">
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

interface AddAccountProps {
  idUsuario: number;
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

const MONEDAS_CONFIG = {
  MXN: { label: "Peso Mexicano (MXN)", symbol: "$" },
  USD: { label: "Dólar Estadounidense (USD)", symbol: "$" },
  EUR: { label: "Euro (EUR)", symbol: "€" },
  CAD: { label: "Dólar Canadiense (CAD)", symbol: "$" },
};

export function AddAccount({ idUsuario }: AddAccountProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Estado del formulario
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [selectedMoneda, setSelectedMoneda] = useState<string>("MXN");
  const [saldoInicial, setSaldoInicial] = useState<string>("0");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createAccount(idUsuario, formData);

      if (result.success) {
        toast.success("Cuenta creada exitosamente");
        setOpen(false);

        // Reset form
        setSelectedTipo("");
        setSelectedMoneda("MXN");
        setSaldoInicial("0");

        router.refresh();
      } else if (result.errors) {
        Object.values(result.errors)
          .flat()
          .forEach((error) => {
            toast.error(error as string);
          });
      } else {
        toast.error(result.error || "Error al crear la cuenta");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSelectedTipo("");
      setSelectedMoneda("MXN");
      setSaldoInicial("0");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Wallet className="w-4 h-4 mr-2" />
          Añadir Cuenta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">Nueva Cuenta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la Cuenta</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej: Cuenta Principal"
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

            {/* Saldo Inicial */}
            <div className="space-y-2">
              <Label htmlFor="saldoInicial">Saldo Inicial</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {MONEDAS_CONFIG[selectedMoneda as keyof typeof MONEDAS_CONFIG]
                    ?.symbol || "$"}
                </span>
                <Input
                  id="saldoInicial"
                  name="saldoInicial"
                  type="number"
                  step="0.01"
                  min="0"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  required
                  disabled={isPending}
                />
              </div>
              <p className="text-xs text-gray-500">
                El saldo con el que iniciarás esta cuenta
              </p>
            </div>

            {/* Moneda */}
            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                name="moneda"
                value={selectedMoneda}
                onValueChange={setSelectedMoneda}
                disabled={isPending}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una moneda" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MONEDAS_CONFIG).map(([key, config]) => (
                    <SelectItem
                      key={key}
                      value={key}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{config.label}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {config.symbol}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview Card */}
            {selectedTipo && (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                <div className="flex items-center gap-3">
                  {(() => {
                    const config =
                      TIPO_CUENTA_CONFIG[
                        selectedTipo as keyof typeof TIPO_CUENTA_CONFIG
                      ];
                    const Icon = config.icon;
                    return (
                      <>
                        <div
                          className="p-3 rounded-lg"
                          style={{ backgroundColor: `${config.color}20` }}
                        >
                          <Icon
                            className="w-6 h-6"
                            style={{ color: config.color }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {document.getElementById("nombre")?.value ||
                              "Nombre de cuenta"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {config.label} • {selectedMoneda}
                          </p>
                          <p className="text-lg font-bold font-jetbrains mt-1">
                            {
                              MONEDAS_CONFIG[
                                selectedMoneda as keyof typeof MONEDAS_CONFIG
                              ]?.symbol
                            }
                            {parseFloat(saldoInicial || "0").toLocaleString(
                              "es-MX",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 ">
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
              {isPending ? "Guardando..." : "Crear Cuenta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
