import Footer from "@/components/layout/footer";
import NavLinks from "@/components/layout/navLinks";
// Layout component
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen">
      <NavLinks />
      {children}
      <Footer />
    </main>
  );
}
