import {
  BookOpen,
  Briefcase,
  Bus,
  Car,
  Coffee,
  DollarSign,
  Dumbbell,
  Gamepad2,
  Heart,
  Home,
  MoreHorizontal,
  PiggyBank,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Ticket,
  TrendingUp,
  Tv,
  Utensils,
  Wrench,
  Zap,
} from "lucide-react";
import { JSX } from "react";

export type IconName =
  | "dollar"
  | "briefcase"
  | "trending_up"
  | "piggy_bank"
  | "shopping_cart"
  | "utensils"
  | "coffee"
  | "car"
  | "bus"
  | "home"
  | "zap"
  | "wrench"
  | "tv"
  | "gamepad"
  | "ticket"
  | "heart"
  | "dumbbell"
  | "book"
  | "shopping_bag"
  | "smartphone"
  | "more_horizontal";

export function getCategoryIcon(iconName: IconName, className?: string) {
  const props = { className: className || "w-5 h-5" };

  const icons: Record<IconName, JSX.Element> = {
    dollar: <DollarSign {...props} />,
    briefcase: <Briefcase {...props} />,
    trending_up: <TrendingUp {...props} />,
    piggy_bank: <PiggyBank {...props} />,
    shopping_cart: <ShoppingCart {...props} />,
    utensils: <Utensils {...props} />,
    coffee: <Coffee {...props} />,
    car: <Car {...props} />,
    bus: <Bus {...props} />,
    home: <Home {...props} />,
    zap: <Zap {...props} />,
    wrench: <Wrench {...props} />,
    tv: <Tv {...props} />,
    gamepad: <Gamepad2 {...props} />,
    ticket: <Ticket {...props} />,
    heart: <Heart {...props} />,
    dumbbell: <Dumbbell {...props} />,
    book: <BookOpen {...props} />,
    shopping_bag: <ShoppingBag {...props} />,
    smartphone: <Smartphone {...props} />,
    more_horizontal: <MoreHorizontal {...props} />,
  };

  return icons[iconName];
}

// Labels en español para el selector
export const ICON_LABELS: Record<IconName, string> = {
  dollar: "Dinero",
  briefcase: "Trabajo",
  trending_up: "Inversiones",
  piggy_bank: "Ahorros",
  shopping_cart: "Supermercado",
  utensils: "Restaurantes",
  coffee: "Café",
  car: "Auto",
  bus: "Transporte",
  home: "Hogar",
  zap: "Servicios",
  wrench: "Mantenimiento",
  tv: "Streaming",
  gamepad: "Videojuegos",
  ticket: "Eventos",
  heart: "Salud",
  dumbbell: "Gym",
  book: "Educación",
  shopping_bag: "Compras",
  smartphone: "Tecnología",
  more_horizontal: "Otros",
};
