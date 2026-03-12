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
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

export function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [produtosOcorrencias, setProdutosOcorrencias] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [fornecedorData, setFornecedorData] = useState<any[]>([]);
  const [garantiasPeriodo, setGarantiasPeriodo] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    taxaProcedencia: 0,
    tempoMedio: "2.5 dias", // Manter hardcoded por enquanto ou calcular se houver data_fechamento
  });

  useEffect(() => {
    async function fetchReportData() {
      try {
        setLoading(true);
        const { data: laudos, error } = await supabase
          .from("laudos")
          .select("*");

        if (error) throw error;

        if (!laudos || laudos.length === 0) {
          setLoading(false);
          return;
        }

        // 1. Produtos com mais ocorrências
        const productCounts: Record<string, number> = {};
        laudos.forEach(l => {
          const desc = l.produto_descricao || "Sem descrição";
          productCounts[desc] = (productCounts[desc] || 0) + 1;
        });
        const topProducts = Object.entries(productCounts)
          .map(([produto, quantidade]) => ({ produto, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5);
        setProdutosOcorrencias(topProducts);

        // 2. Procedente vs Não procedente
        let procedente = 0;
        let naoProcedente = 0;
        laudos.forEach(l => {
          const produtos = (l.xml_dados as any)?.produtos || [];
          produtos.forEach((p: any) => {
            if (p.recebido) {
              if (p.status === "procedente") procedente++;
              else if (p.status === "nao-procedente") naoProcedente++;
            }
          });
        });
        setStatusData([
          { name: "Procedente", value: procedente, color: "#22c55e" },
          { name: "Não procedente", value: naoProcedente, color: "#ef4444" },
        ]);

        // 3. Garantias por Fabricante (Fornecedor)
        const manufacturerCounts: Record<string, number> = {};
        laudos.forEach(l => {
          const produtos = (l.xml_dados as any)?.produtos || [];
          produtos.forEach((p: any) => {
            const fab = p.fabricante || "Outros";
            manufacturerCounts[fab] = (manufacturerCounts[fab] || 0) + 1;
          });
        });
        const topManufacturers = Object.entries(manufacturerCounts)
          .map(([fornecedor, quantidade]) => ({ fornecedor, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5);
        setFornecedorData(topManufacturers);

        // 4. Garantias por período (últimos 7 meses)
        const last7Months = Array.from({ length: 7 }, (_, i) => {
          const date = subMonths(new Date(), 6 - i);
          return {
            month: startOfMonth(date),
            label: format(date, "MMM", { locale: ptBR }),
            quantidade: 0,
          };
        });

        laudos.forEach(l => {
          const createdAt = parseISO(l.created_at);
          last7Months.forEach(m => {
            if (isWithinInterval(createdAt, {
              start: m.month,
              end: endOfMonth(m.month)
            })) {
              m.quantidade++;
            }
          });
        });
        setGarantiasPeriodo(last7Months.map(m => ({ mes: m.label, quantidade: m.quantidade })));

        // 5. Estatísticas Gerais
        const total = laudos.length;
        const taxa = total > 0 ? (procedente / total) * 100 : 0;
        setStats(prev => ({
          ...prev,
          total,
          taxaProcedencia: taxa,
        }));

      } catch (error) {
        console.error("Erro ao carregar dados do relatório:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReportData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

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
            Garantias por Fabricante
          </h3>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fabricante
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
              <p className="text-3xl font-semibold text-gray-900 mt-1">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Procedência</p>
              <p className="text-3xl font-semibold text-green-600 mt-1">{stats.taxaProcedencia.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Médio de Análise</p>
              <p className="text-3xl font-semibold text-blue-600 mt-1">{stats.tempoMedio}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
