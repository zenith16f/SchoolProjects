"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ComponentType<{ className?: string }>;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, icon: Icon, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 " />
        )}
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", Icon && "pl-10", className)}
          ref={ref}
          {...props}
        />
        <button
          type="button"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent cursor-pointer"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={
            showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
          }
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 " />
          ) : (
            <Eye className="h-4 w-4 " />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default PasswordInput;
