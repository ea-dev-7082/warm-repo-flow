import { DataTable } from "./DataTable";
import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const historicoData = [
  {
    data: "04/03/2026",
    produto: "Motor X500",
    cliente: "Distribuidora ABC",
    nfGarantia: "12345",
    status: "Procedente",
    responsavel: "João Silva",
  },
  {
    data: "04/03/2026",
    produto: "Suspensão Y200",
    cliente: "Autopeças Silva",
    nfGarantia: "12346",
    status: "Em análise",
    responsavel: "Maria Santos",
  },
  {
    data: "03/03/2026",
    produto: "Freio Z300",
    cliente: "Mecânica Souza",
    nfGarantia: "12347",
    status: "Não procedente",
    responsavel: "Pedro Costa",
  },
  {
    data: "03/03/2026",
    produto: "Motor X500",
    cliente: "Auto Center Norte",
    nfGarantia: "12348",
    status: "Procedente",
    responsavel: "João Silva",
  },
  {
    data: "02/03/2026",
    produto: "Sistema Elétrico",
    cliente: "Peças Brasil",
    nfGarantia: "12349",
    status: "Em análise",
    responsavel: "Ana Lima",
  },
  {
    data: "02/03/2026",
    produto: "Lubrificante L100",
    cliente: "Distribuidora XYZ",
    nfGarantia: "12350",
    status: "Procedente",
    responsavel: "Carlos Oliveira",
  },
  {
    data: "01/03/2026",
    produto: "Suspensão Y200",
    cliente: "Oficina Central",
    nfGarantia: "12351",
    status: "Não procedente",
    responsavel: "Maria Santos",
  },
  {
    data: "01/03/2026",
    produto: "Motor X500",
    cliente: "Auto Service",
    nfGarantia: "12352",
    status: "Procedente",
    responsavel: "João Silva",
  },
];

const columns = [
  { key: "data", label: "Data" },
  { key: "produto", label: "Produto" },
  { key: "cliente", label: "Cliente" },
  { key: "nfGarantia", label: "NF Garantia" },
  { key: "status", label: "Status" },
  { key: "responsavel", label: "Responsável" },
];

export function Historico() {
  const [filters, setFilters] = useState({
    periodoInicio: "",
    periodoFim: "",
    produto: "",
    cliente: "",
    status: "",
  });

  const navigate = useNavigate();

  const handleViewReport = (item: any) => {
    navigate(`/laudo/${item.nfGarantia}`);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período (Início)
            </label>
            <input
              type="date"
              value={filters.periodoInicio}
              onChange={(e) =>
                setFilters({ ...filters, periodoInicio: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período (Fim)
            </label>
            <input
              type="date"
              value={filters.periodoFim}
              onChange={(e) =>
                setFilters({ ...filters, periodoFim: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produto
            </label>
            <input
              type="text"
              value={filters.produto}
              onChange={(e) =>
                setFilters({ ...filters, produto: e.target.value })
              }
              placeholder="Buscar produto..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <input
              type="text"
              value={filters.cliente}
              onChange={(e) =>
                setFilters({ ...filters, cliente: e.target.value })
              }
              placeholder="Buscar cliente..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="procedente">Procedente</option>
              <option value="nao-procedente">Não procedente</option>
              <option value="em-analise">Em análise</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Limpar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Search size={18} />
            Buscar
          </button>
        </div>
      </div>

      {/* Tabela de Histórico */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Histórico de Movimentações
          </h3>
          <span className="text-sm text-gray-600">
            Total: {historicoData.length} registros
          </span>
        </div>
        <DataTable
          columns={columns}
          data={historicoData}
          onView={handleViewReport}
        />
      </div>
    </div>
  );
}
