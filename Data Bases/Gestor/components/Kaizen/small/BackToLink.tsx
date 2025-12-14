import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface BackProps {
  icon: LucideIcon;
  title: string;
  url: string;
}

const BackToLink = ({ icon: Icon, title, url }: BackProps) => {
  return (
    <Link
      href={`/${url}`}
      className="flex flex-row gap-2 hover:text-deep-blue ease-in-out"
    >
      <Icon />
      <span>Volver a {title}</span>
    </Link>
  );
};

export default BackToLink;
