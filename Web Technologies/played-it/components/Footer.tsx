import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-muted text-xs font-body">
          © {new Date().getFullYear()}{" "}
          <span className="text-white font-medium">PlayedIt</span>. Todos los
          derechos reservados.
        </p>
        <nav
          aria-label="Pie de página"
          className="flex items-center gap-5"
        >
          <Link
            href="#"
            className="text-muted hover:text-white text-xs transition-colors font-medium"
          >
            Acerca de
          </Link>
          <Link
            href="#"
            className="text-muted hover:text-white text-xs transition-colors font-medium"
          >
            Contacto
          </Link>
          <Link
            href="#"
            className="text-muted hover:text-white text-xs transition-colors font-medium"
          >
            Privacidad
          </Link>
        </nav>
      </div>
    </footer>
  );
}
