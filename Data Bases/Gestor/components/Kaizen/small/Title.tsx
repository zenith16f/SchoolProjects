import { LucideIcon } from "lucide-react";

interface TittleProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const Title = ({ icon: Icon, title, description }: TittleProps) => {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-6 h-6" />
        <span className="text-3xl font-semibold">{title}</span>
      </div>
      <span className="ml-4 pl-4 text-gray-600">{description}</span>
    </section>
  );
};

export default Title;
