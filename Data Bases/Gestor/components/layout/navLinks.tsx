"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 border-b-2 transition-all duration-300 ${
        isScrolled
          ? "bg-transparent backdrop-blur-sm shadow-md pt-0.5 ease-in-out "
          : "bg-transparent shadow-md"
      }`}
    >
      <section className="flex justify-between items-center m-4 pl-4 sm:pl-8">
        <div className="flex items-center gap-4 sm:gap-8">
          <Image
            src={"/Logo.svg"}
            width={40}
            height={40}
            alt="Logo de la App"
            className="w-8 h-8 sm:w-10 sm:h-10"
          />
          <span className="font-semibold text-lg sm:text-xl tracking-wide">
            Káizen
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href={"/login"}
            className="py-1.5 px-2 sm:px-3 text-xs sm:text-sm ease-in-out duration-300 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
          >
            Iniciar Sesión
          </Link>

          <Link
            href={"/register"}
            className="py-1.5 px-2 sm:px-3 text-xs sm:text-sm ease-in-out duration-300 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Registrarse
          </Link>
        </div>
      </section>
    </nav>
  );
}
