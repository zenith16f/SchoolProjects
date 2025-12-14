import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm pt-12 pb-8 transition-shadow hover:shadow-md">
      <div className="mb-4">
        <Icon className="h-6 w-6 text-gray-700" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </section>
  );
};

export { FeatureCard };
