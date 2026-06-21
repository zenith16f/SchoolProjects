import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Header mínimo */}
      <header className="px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="bg-accent text-surface font-display font-bold text-sm px-2 py-0.5 rounded select-none">
            PI
          </span>
          <span className="font-display font-semibold text-lg tracking-tight logo-glow text-accent">
            PlayedIt
          </span>
        </Link>
      </header>

      {/* Contenido centrado */}
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer mínimo */}
      <footer className="px-4 py-4 text-center">
        <p className="text-muted text-xs">
          © {new Date().getFullYear()} PlayedIt
        </p>
      </footer>
    </div>
  );
}
