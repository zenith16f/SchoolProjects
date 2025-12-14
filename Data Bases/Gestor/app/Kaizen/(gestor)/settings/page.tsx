// "use client";
// import {
//   DataCard,
//   ProfileCard,
//   SecurityCard,
// } from "@/components/Kaizen/settings/Cards";
// import Title from "@/components/Kaizen/small/Title";
import { Download, Lock, Settings as SettingsIcon, User } from "lucide-react";
// import { useState } from "react";

// interface MenuOptionProps {
//   icon: React.ComponentType<{ className?: string }>;
//   label: string;
//   isActive: boolean;
//   onClick: () => void;
// }

// const menuOptions = [
//   { id: "perfil", label: "Perfil", icon: User },
//   { id: "seguridad", label: "Seguridad", icon: Lock },
//   { id: "datos", label: "Datos", icon: Download },
// ];

// const MenuOption = ({
//   icon: Icon,
//   label,
//   isActive,
//   onClick,
// }: MenuOptionProps) => (
//   <button
//     onClick={onClick}
//     className={`w-full flex items-center gap-3 px-6 py-4 transition-all cursor-pointer ${
//       isActive ? "bg-gray-100" : "bg-white hover:bg-gray-50"
//     }`}
//   >
//     <Icon
//       className={`w-5 h-5 ${isActive ? "text-gray-800" : "text-gray-600"}`}
//     />
//     <span
//       className={`text-base ${
//         isActive ? "font-medium text-gray-900" : "text-gray-700"
//       }`}
//     >
//       {label}
//     </span>
//   </button>
// );

// const Settings = () => {
//   const [activeSection, setActiveSection] = useState("perfil");

//   const renderContent = () => {
//     switch (activeSection) {
//       case "perfil":
//         return <ProfileCard />;

//       case "seguridad":
//         return <SecurityCard />;

//       case "datos":
//         return <DataCard  />;

//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="min-h-screen flex flex-col p-4 ">
//       <Title
//         icon={SettingsIcon}
//         title="Configuración"
//         description="Administra tu cuenta y preferencias"
//       ></Title>

//       <div className="w-full flex flex-col gap-20 overflow-hidden ">
//         <section className="w-full bg-white rounded-xl shadow-sm overflow-hidden">
//           <div className="border border-gray-200">
//             {menuOptions.map((option) => (
//               <MenuOption
//                 key={option.id}
//                 icon={option.icon}
//                 label={option.label}
//                 isActive={activeSection === option.id}
//                 onClick={() => setActiveSection(option.id)}
//               />
//             ))}
//           </div>
//         </section>

//         <section className="w-full bg-white rounded-xl shadow-sm overflow-hidden">
//           <div className="border border-gray-200">{renderContent()}</div>
//         </section>
//       </div>
//     </div>
//   );
// };

// export default Settings;

import Title from "@/components/Kaizen/small/Title";

const Settings = () => {
  return (
    <div className="min-h-screen flex flex-col p-4 ">
      <Title
        icon={SettingsIcon}
        title="Configuración"
        description="Administra tu cuenta y preferencias"
      ></Title>

      <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mt-8 flex flex-col items-center justify-center py-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
            <span className="text-sm font-medium">Próximamente</span>
          </div>
          <p className="text-gray-400 text-sm mt-4">
            Esta funcionalidad estará disponible pronto
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
