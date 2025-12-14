interface AccountDetailProps {
  nombre: string;
  tipo: string;
  saldoInicial: number;
  saldoActual: number;
  moneda: string;
  fechaCreacion: string;
  activa: boolean;
}

export function AccountDetailCard({
  nombre,
  tipo,
  saldoInicial,
  saldoActual,
  moneda,
  fechaCreacion,
  activa,
}: AccountDetailProps) {
  // Calcular ganancia/pérdida
  const diferencia = saldoActual - saldoInicial;
  const esGanancia = diferencia >= 0;

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2 capitalize">{tipo}</p>
            <h2 className="text-3xl font-bold text-gray-900 font-jetbrains">
              {nombre}
            </h2>
          </div>
          {/* Badge de estado */}
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              activa ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {activa ? "Activa" : "Inactiva"}
          </span>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Información de la Cuenta
        </h3>

        <div className="space-y-4">
          {/* Saldo Inicial */}
          <div className="border-b border-gray-100 pb-4">
            <p className="text-sm text-gray-600 mb-1">Saldo Inicial</p>
            <p className="text-lg font-semibold text-gray-900 font-jetbrains">
              {moneda} $
              {saldoInicial.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Saldo Actual */}
          <div className="border-b border-gray-100 pb-4">
            <p className="text-sm text-gray-600 mb-1">Saldo Actual</p>
            <p className="text-lg font-semibold text-gray-900 font-jetbrains">
              {moneda} $
              {saldoActual.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Ganancia/Pérdida */}
          <div className="border-b border-gray-100 pb-4">
            <p className="text-sm text-gray-600 mb-1">
              {esGanancia ? "Ganancia" : "Pérdida"}
            </p>
            <p
              className={`text-lg font-semibold ${
                esGanancia ? "text-salvia-green" : "text-spectrum-red"
              } font-jetbrains`}
            >
              {esGanancia ? "+" : "-"}
              {moneda} $
              {Math.abs(diferencia).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Tipo de Cuenta */}
          <div className="border-b border-gray-100 pb-4">
            <p className="text-sm text-gray-600 mb-1">Tipo de Cuenta</p>
            <p className="text-lg font-semibold text-gray-900 capitalize">
              {tipo}
            </p>
          </div>

          {/* Moneda */}
          <div className="border-b border-gray-100 pb-4">
            <p className="text-sm text-gray-600 mb-1">Moneda</p>
            <p className="text-lg font-semibold text-gray-900">{moneda}</p>
          </div>

          {/* Fecha de Creación */}
          <div>
            <p className="text-sm text-gray-600 mb-1">Fecha de Creación</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(fechaCreacion)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
