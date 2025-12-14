// Imports
import Image from "next/image";

// Component
const Footer = () => {
  return (
    <footer>
      <hr />
      <section className="m-5 pt-4 pl-4 flex-row gap-8 ">
        <div className="flex align-middle gap-10 mb-5">
          <Image
            src={"/Logo.svg"}
            width={40}
            height={40}
            alt="Logo de la App"
          />
          <span className="content-center font-semibold text-xl tracking-wide">
            Káizen
          </span>
        </div>
        <div>
          <span>© 2025 Káizen. Proyecto Escolar de Base de Datos.</span>
        </div>
      </section>
    </footer>
  );
};

export default Footer;
