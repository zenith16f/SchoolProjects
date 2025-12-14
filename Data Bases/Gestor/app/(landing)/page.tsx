import { ExampleCard } from "@/components/landing/ExampleCard";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { BlurFade } from "@/components/ui/blur-fade";
import { TextAnimate } from "@/components/ui/text-animate";
import { TypingAnimation } from "@/components/ui/typing-animation";
import { CircleCheck, MoveRight, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";

const featuresInformation = [
  {
    icon: TrendingUp,
    title: "Metas de Ahorro",
    description:
      "Define objetivos financieros y rastrea tu progreso automáticamente hacia tus sueños",
  },
  {
    icon: Shield,
    title: "Datos Seguros",
    description:
      "Tu información financiera protegida con los más altos estándares de seguridad",
  },
];

const exampleInfo = [
  {
    title: "Alimentación",
    amount: 450,
    type: "expense",
  },
  {
    title: "Transporte",
    amount: 230,
    type: "expense",
  },
  {
    title: "Salario",
    amount: 3000,
    type: "income",
  },
  {
    title: "Entretenimiento",
    amount: 120,
    type: "expense",
  },
];

const LandingPage = () => {
  return (
    <div className="flex flex-col items-center gap-20 my-10">
      <section className="flex flex-col gap-4 justify-center mt-10 w-full">
        <section className="flex flex-col align-middle gap-1 mb-2 p-4">
          <TextAnimate
            by="character"
            animation="blurInUp"
            className="text-6xl text-center font-semibold "
            duration={2.5}
            once={true}
          >
            Toma Control de tus
          </TextAnimate>

          <TextAnimate
            by="character"
            animation="blurInUp"
            className="text-6xl text-center font-semibold "
            duration={2.5}
            once={true}
          >
            Finanzas Personales
          </TextAnimate>
        </section>
        <section className="flex flex-col align-middle ">
          <TypingAnimation
            className="text-2xl justify-center text-center"
            showCursor={false}
            startOnView
            delay={450}
            typeSpeed={25}
          >
            Gestiona tus gastos, establece presupuestos inteligentes y alcanza
            tus metas
          </TypingAnimation>
          <TypingAnimation
            className="text-2xl justify-center text-center"
            showCursor={false}
            startOnView
            delay={500}
            typeSpeed={25}
          >
            financieras con la herramienta más intuitiva del mercado
          </TypingAnimation>
        </section>
        <section className="flex justify-center mt-4">
          <BlurFade
            delay={0.5}
            duration={1.5}
          >
            <Link
              href={"/register"}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 px-7 py-3"
            >
              <span>Registrarse</span>
              <MoveRight />
            </Link>
          </BlurFade>
        </section>
      </section>
      <section className="flex flex-col gap-3 sm:gap-4 md:gap-6 w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4">
        <BlurFade
          delay={1.5}
          duration={1}
        >
          <section className="flex flex-col gap-5 text-center my-5 ">
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-center font-semibold">
              Todo lo que necesitas para gestionar tu dinero
            </span>
            <span className="sm:text-sm md:text-sm lg:text-xl justify-center text-center ">
              Herramientas poderosas diseñadas para hacer tu vida financiera más
              simple
            </span>
          </section>
          <section className="flex flex-col gap-14">
            {featuresInformation.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </section>
        </BlurFade>
      </section>
      <section className="flex flex-col gap-3 sm:gap-4 md:gap-6 w-full max-w-sm sm:max-w-2xl md:max-w-4xl lg:max-w-5xl mx-auto px-4">
        <BlurFade
          inView
          duration={1}
          delay={0.5}
        >
          <section className="flex flex-col gap-8 text-center my-5 ">
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-center font-semibold">
              Características que marcan la diferencia
            </span>
            <span className="sm:text-sm md:text-sm lg:text-xl justify-center text-center ">
              Desde el primer día, tendrás acceso a todas las herramientas
              profesionales sin costo adicional
            </span>
          </section>
          <section className="flex flex-row justify-between mx-5 px-5 py-3 my-7">
            <section className="flex flex-col gap-4">
              <span className="flex items-center gap-2 sm:gap-3 md:gap-4 text-sm sm:text-base md:text-lg">
                <CircleCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 shrink-0" />
                Múltiples cuentas
              </span>
              <span className="flex items-center gap-2 sm:gap-3 md:gap-4 text-sm sm:text-base md:text-lg">
                <CircleCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 shrink-0" />
                Reportes Detallados
              </span>
              <span className="flex items-center gap-2 sm:gap-3 md:gap-4 text-sm sm:text-base md:text-lg">
                <CircleCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 shrink-0" />
                Exportación de datos
              </span>
            </section>
            <section className="flex flex-col gap-4">
              <span className="flex items-center gap-2 sm:gap-3 md:gap-4 text-sm sm:text-base md:text-lg">
                <CircleCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 shrink-0" />
                Categorías personalizables
              </span>
              <span className="flex items-center gap-2 sm:gap-3 md:gap-4 text-sm sm:text-base md:text-lg">
                <CircleCheck className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 shrink-0" />
                Sin publicidad
              </span>
            </section>
          </section>
          <section className="flex flex-col gap-2 p-4 m-4 bg-white border border-gray-200 rounded-lg">
            {exampleInfo.map((feature, index) => (
              <ExampleCard
                key={index}
                title={feature.title}
                amount={feature.amount}
                type={feature.type}
              />
            ))}
          </section>
        </BlurFade>
      </section>
      <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <BlurFade
          inView
          duration={1}
          delay={0.5}
        >
          <div className="border border-gray-200 rounded-2xl linear-gradient-to-br from-gray-50 to-white  p-8 sm:p-12 md:p-16">
            <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
              <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Comienza hoy mismo
              </span>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl leading-relaxed">
                Únete a miles de personas que ya transformaron su relación con
                el dinero
              </p>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-black text-white rounded-full font-semibold text-sm sm:text-base transition-all duration-300  hover:scale-105 hover:shadow-xl"
              >
                Crear una cuenta gratis
                <MoveRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="text-xs sm:text-sm text-gray-500 pt-2">
                No requiere tarjeta de crédito · Configuración en 2 minutos
              </p>
            </div>
          </div>
        </BlurFade>
      </section>
    </div>
  );
};

export default LandingPage;
