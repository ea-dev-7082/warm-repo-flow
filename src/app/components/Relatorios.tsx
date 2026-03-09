import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const produtosOcorrencias = [
  { produto: "Motor X500", quantidade: 45 },
  { produto: "Suspensão Y200", quantidade: 32 },
  { produto: "Freio Z300", quantidade: 28 },
  { produto: "Sistema Elétrico", quantidade: 22 },
  { produto: "Lubrificante L100", quantidade: 15 },
];

const statusData = [
  { name: "Procedente", value: 78, color: "#22c55e" },
  { name: "Não procedente", value: 49, color: "#ef4444" },
];

const fornecedorData = [
  { fornecedor: "Fornecedor A", quantidade: 45 },
  { fornecedor: "Fornecedor B", quantidade: 38 },
  { fornecedor: "Fornecedor C", quantidade: 25 },
  { fornecedor: "Fornecedor D", quantidade: 19 },
];

const garantiasPeriodo = [
  { mes: "Set", quantidade: 32 },
  { mes: "Out", quantidade: 45 },
  { mes: "Nov", quantidade: 38 },
  { mes: "Dez", quantidade: 52 },
  { mes: "Jan", quantidade: 48 },
  { mes: "Fev", quantidade: 41 },
  { mes: "Mar", quantidade: 35 },
];

export function Relatorios() {
  return (
    <div className="space-y-6">
      {/* Gráfico 1: Produtos com mais ocorrências */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Produtos com mais ocorrências de garantia
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={produtosOcorrencias}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="produto" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="quantidade" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico 2: Procedente vs Não procedente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Procedente vs Não procedente
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela: Fornecedor */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Garantias por Fornecedor
          </h3>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fornecedor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantidade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {fornecedorData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.fornecedor}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.quantidade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Gráfico de linha: Garantias por período */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Garantias por período
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={garantiasPeriodo}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="quantidade"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Resumo Estatístico */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Garantias</p>
              <p className="text-3xl font-semibold text-gray-900 mt-1">127</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Procedência</p>
              <p className="text-3xl font-semibold text-green-600 mt-1">61.4%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Médio de Análise</p>
              <p className="text-3xl font-semibold text-blue-600 mt-1">2.5 dias</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
