import { MetricCard } from "./MetricCard";
import { DataTable } from "./DataTable";
import { FileText, CheckCircle, XCircle, Package, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";

const metricsData = [
  {
    title: "Garantias recebidas no mês",
    value: "127",
    icon: FileText,
    iconColor: "text-blue-500",
  },
  {
    title: "Procedentes",
    value: "78",
    icon: CheckCircle,
    iconColor: "text-green-500",
  },
  {
    title: "Não procedentes",
    value: "49",
    icon: XCircle,
    iconColor: "text-red-500",
  },
  {
    title: "Produto com mais ocorrências",
    value: "Motor X500",
    icon: Package,
    iconColor: "text-orange-500",
  },
];

const chartData = [
  { produto: "Motor X500", quantidade: 45 },
  { produto: "Suspensão Y200", quantidade: 32 },
  { produto: "Freio Z300", quantidade: 28 },
  { produto: "Sistema Elétrico", quantidade: 22 },
  { produto: "Lubrificante L100", quantidade: 15 },
];

const recentMovements = [
  {
    cliente: "Distribuidora ABC",
    produto: "Motor X500",
    nfGarantia: "12345",
    status: "Procedente",
    data: "04/03/2026",
  },
  {
    cliente: "Autopeças Silva",
    produto: "Suspensão Y200",
    nfGarantia: "12346",
    status: "Em análise",
    data: "04/03/2026",
  },
  {
    cliente: "Mecânica Souza",
    produto: "Freio Z300",
    nfGarantia: "12347",
    status: "Não procedente",
    data: "03/03/2026",
  },
  {
    cliente: "Auto Center Norte",
    produto: "Motor X500",
    nfGarantia: "12348",
    status: "Procedente",
    data: "03/03/2026",
  },
  {
    cliente: "Peças Brasil",
    produto: "Sistema Elétrico",
    nfGarantia: "12349",
    status: "Em análise",
    data: "02/03/2026",
  },
];

const columns = [
  { key: "cliente", label: "Cliente" },
  { key: "produto", label: "Produto" },
  { key: "nfGarantia", label: "NF Garantia" },
  { key: "status", label: "Status" },
  { key: "data", label: "Data" },
];

export function Dashboard() {
  const navigate = useNavigate();

  const handleViewReport = (item: any) => {
    navigate(`/laudo/${item.nfGarantia}`);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsData.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Produtos com mais garantia
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="produto" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="quantidade" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Movements */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Movimentações recentes
          </h3>
          <button
            onClick={() => navigate("/nova-analise")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Nova Análise
          </button>
        </div>
        <DataTable
          columns={columns}
          data={recentMovements}
          onView={handleViewReport}
        />
      </div>
    </div>
  );
}
