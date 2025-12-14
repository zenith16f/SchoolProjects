import { NumberTicker } from "@/components/ui/number-ticker";

interface exampleProps {
  title: string;
  amount: number;
  type: string;
}

export const ExampleCard = ({ title, amount, type }: exampleProps) => {
  const isExpense = type === "expense";
  const sign = isExpense ? "-" : "+";

  return (
    <div className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow mx-8 my-1.5">
      <span className="text-gray-800 font-medium">{title}</span>
      <span className="font-jetbrains">
        {sign}$
        <NumberTicker
          delay={1.5}
          value={amount}
        ></NumberTicker>
      </span>
    </div>
  );
};
