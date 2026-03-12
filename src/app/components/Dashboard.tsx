import { MetricCard } from "./MetricCard";
import { DataTable } from "./DataTable";
import { FileText, CheckCircle, XCircle, Package, Plus, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

interface DashboardMetric {
  title: string;
  value: string;
  icon: any;
  iconColor: string;
}

interface ChartDataItem {
  produto: string;
  quantidade: number;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [recentMovements, setRecentMovements] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // 1. Fetch Metrics Data
        const now = new Date();
        const start = startOfMonth(now).toISOString();
        const end = endOfMonth(now).toISOString();

        const { data: monthData, error: monthError } = await supabase
          .from("laudos")
          .select("status, produto_descricao, xml_dados")
          .gte("created_at", start)
          .lte("created_at", end);

        if (monthError) throw monthError;

        let procedentesCount = 0;
        let naoProcedentesCount = 0;

        monthData?.forEach(report => {
          const products = (report.xml_dados as any)?.produtos || [];
          products.forEach((p: any) => {
            if (p.recebido) {
              if (p.status === 'procedente') procedentesCount++;
              if (p.status === 'nao-procedente') naoProcedentesCount++;
            }
          });
        });

        // Calculate product with most occurrences
        const productCounts: Record<string, number> = {};
        monthData?.forEach(item => {
          productCounts[item.produto_descricao] = (productCounts[item.produto_descricao] || 0) + 1;
        });

        const topProduct = Object.entries(productCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || "Nenhum";

        setMetrics([
          {
            title: "Garantias recebidas no mês",
            value: (monthData?.length || 0).toString(),
            icon: FileText,
            iconColor: "text-blue-500",
          },
          {
            title: "Procedentes",
            value: procedentesCount.toString(),
            icon: CheckCircle,
            iconColor: "text-green-500",
          },
          {
            title: "Não procedentes",
            value: naoProcedentesCount.toString(),
            icon: XCircle,
            iconColor: "text-red-500",
          },
          {
            title: "Produto com mais ocorrências",
            value: topProduct,
            icon: Package,
            iconColor: "text-orange-500",
          },
        ]);

        // 2. Fetch Chart Data (Top 5 products overall)
        const { data: allData, error: allError } = await supabase
          .from("laudos")
          .select("produto_descricao");

        if (allError) throw allError;

        const allProductCounts: Record<string, number> = {};
        allData?.forEach(item => {
          allProductCounts[item.produto_descricao] = (allProductCounts[item.produto_descricao] || 0) + 1;
        });

        const formattedChartData = Object.entries(allProductCounts)
          .map(([produto, quantidade]) => ({ produto, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5);

        setChartData(formattedChartData);

        // 3. Fetch Recent Movements
        const { data: recentData, error: recentError } = await supabase
          .from("laudos")
          .select("id, cliente_nome, produto_descricao, nf_garantia, status, created_at, responsavel_nome, xml_dados")
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentError) throw recentError;

        setRecentMovements(recentData?.map(item => {
          const xmlDados = (item.xml_dados as any) || {};
          return {
            id: item.id,
            cliente: item.cliente_nome,
            produto: item.produto_descricao,
            nfGarantia: item.nf_garantia,
            status: item.status,
            data: new Date(xmlDados.data || item.created_at).toLocaleDateString("pt-BR"),
            // Store the full object for navigation
            fullData: {
              id: item.id,
              cliente: item.cliente_nome,
              nfGarantia: item.nf_garantia,
              data: xmlDados.data || item.created_at,
              statusLaudo: (item.status === 'Finalizado' || item.status === 'finalizado') ? 'finalizado' : 'aberto',
              responsavel: item.responsavel_nome || undefined,
              produtos: xmlDados.produtos || [],
              ...xmlDados,
            }
          };
        }) || []);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const handleViewReport = (item: any) => {
    navigate(`/laudo/${item.id}`, { state: item.fullData });
  };

  const columns = [
    { key: "cliente", label: "Cliente" },
    { key: "produto", label: "Produto" },
    { key: "nfGarantia", label: "NF Garantia" },
    { key: "status", label: "Status" },
    { key: "data", label: "Data" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
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
