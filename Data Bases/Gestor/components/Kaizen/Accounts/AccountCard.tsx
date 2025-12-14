"use client";
import Link from "next/link";

interface AccountsProps {
  id: number;
  name: string;
  type: string;
  money: number;
  active: boolean;
}

const AccountCard = ({ id, name, type, money }: AccountsProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="pt-4 px-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 capitalize">{type}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-1">Saldo Disponible</p>
          <p className="text-3xl font-bold text-gray-900">
            $
            {money.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="flex justify-end">
          <Link
            href={`/Kaizen/accounts/${id}`}
            className="py-1.5 px-2 sm:px-3 text-xs sm:text-sm ease-in-out duration-300 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Ver cuenta
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccountCard;
