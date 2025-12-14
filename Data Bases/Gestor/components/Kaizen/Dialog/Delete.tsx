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
import { deleteAccount } from "@/libs/actions/accounts";
import { deleteOperation } from "@/libs/actions/operations";
import { deleteCategory } from "@/libs/actions/tags";
import { DialogDescription } from "@radix-ui/react-dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface DeleteAccountProps {
  idCuenta: number;
  nombreCuenta: string;
}

interface DeleteTagProps {
  idCategoria: number;
  nombreCategoria: string;
}

interface DeleteOperationProps {
  idTransaccion: number;
  descripcionTransaccion: string;
}

export function DeleteOperation({
  idTransaccion,
  descripcionTransaccion,
}: DeleteOperationProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isConfirmValid = confirmText === descripcionTransaccion;

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfirmValid) {
      toast.error("La descripción no coincide");
      return;
    }

    startTransition(async () => {
      const result = await deleteOperation(idTransaccion, confirmText);

      if (result.success) {
        toast.success("Operación eliminada exitosamente");
        setOpen(false);

        setTimeout(() => {
          router.push("/Kaizen/operations");
          router.refresh();
        }, 500);
      } else {
        toast.error(result.error || "Error al eliminar la operación");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmText("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Trash2 className="w-4 h-4" /> Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">
            ¿Eliminar Transacción?
          </DialogTitle>
          <hr />

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                ⚠️ Acción irreversible
              </p>
              <p className="text-sm text-red-700 mt-1">
                Esta transacción será eliminada permanentemente y el saldo de la
                cuenta será ajustado. No se puede deshacer.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleDelete}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="confirm-operation"
                className="text-sm font-medium"
              >
                Para confirmar, escriba {`"${descripcionTransaccion}"`} debajo
              </Label>
              <Input
                id="confirm-operation"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={descripcionTransaccion}
                className="w-full"
                disabled={isPending}
                autoComplete="off"
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
              variant="destructive"
              className="cursor-pointer bg-spectrum-red hover:bg-red-700"
              disabled={!isConfirmValid || isPending}
            >
              {isPending ? "Eliminando..." : "Eliminar Permanentemente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTag({ idCategoria, nombreCategoria }: DeleteTagProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isConfirmValid = confirmText === nombreCategoria;

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfirmValid) {
      toast.error("El nombre no coincide");
      return;
    }

    startTransition(async () => {
      const result = await deleteCategory(idCategoria, confirmText);

      if (result.success) {
        toast.success("Categoría eliminada exitosamente");
        setOpen(false);

        setTimeout(() => {
          router.push("/Kaizen/tags");
          router.refresh();
        }, 500);
      } else {
        toast.error(result.error || "Error al eliminar la categoría");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmText("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Trash2 className="w-4 h-4" /> Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">
            ¿Eliminar Categoría?
          </DialogTitle>
          <hr />
          <DialogDescription className="text-sm text-gray-700">
            Esta acción no se puede deshacer. La categoría será eliminada
            permanentemente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDelete}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="confirm-category"
                className="text-sm font-medium"
              >
                Para confirmar, escriba {`"${nombreCategoria}"`} debajo
              </Label>
              <Input
                id="confirm-category"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={nombreCategoria}
                className="w-full"
                disabled={isPending}
                autoComplete="off"
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
              variant="destructive"
              className="cursor-pointer bg-red-600 hover:bg-red-700"
              disabled={!isConfirmValid || isPending}
            >
              {isPending ? "Eliminando..." : "Eliminar Categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteAccount({ idCuenta, nombreCuenta }: DeleteAccountProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isConfirmValid = confirmText === nombreCuenta;

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConfirmValid) {
      toast.error("El nombre no coincide");
      return;
    }

    startTransition(async () => {
      const result = await deleteAccount(idCuenta, confirmText);

      if (result.success) {
        toast.success("Cuenta eliminada exitosamente");
        setOpen(false);

        // Pequeño delay para que se vea el toast antes de redirigir
        setTimeout(() => {
          router.push("/Kaizen/accounts");
          router.refresh();
        }, 500);
      } else {
        toast.error(result.error || "Error al eliminar la cuenta");
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmText("");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Trash2 className="w-4 h-4" /> Eliminar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="relative">
          <DialogTitle className="text-xl font-bold">
            ¿Eliminar Cuenta?
          </DialogTitle>
          <hr />
          <DialogDescription className="text-sm text-gray-700">
            Esta acción no se puede deshacer. La cuenta será eliminada
            permanentemente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDelete}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="confirm-name"
                className="text-sm font-medium"
              >
                Para confirmar, escriba {`"${nombreCuenta}"`} debajo
              </Label>
              <Input
                id="confirm-name"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={nombreCuenta}
                className="w-full"
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
              variant="destructive"
              className="cursor-pointer bg-spectrum-red hover:bg-red-700"
              disabled={!isConfirmValid || isPending}
            >
              {isPending ? "Eliminando..." : "Eliminar Cuenta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
