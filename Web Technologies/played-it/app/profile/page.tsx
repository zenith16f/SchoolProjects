import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/actions/user";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileEditor from "@/components/ProfileEditor";

export const metadata: Metadata = {
  title: "Mi perfil",
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const profile = await getProfile(userId);

  if (!profile) {
    redirect("/login");
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Navbar />
      <main id="main-content" className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header del perfil */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent text-2xl font-display font-bold">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-white">
                {profile.username}
              </h1>
              <p className="text-muted text-sm">
                Miembro desde {memberSince}
              </p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-muted">
                  <span className="text-white font-semibold">{profile._count.resenas}</span> reseñas
                </span>
                <span className="text-xs text-muted">
                  <span className="text-white font-semibold">{profile._count.listasJuegos}</span> juegos en lista
                </span>
              </div>
            </div>
          </div>

          {/* Componente client con los formularios */}
          <ProfileEditor
            username={profile.username}
            email={profile.email}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
