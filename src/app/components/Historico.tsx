import { Search, FileText, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLaudos } from "../contexts/LaudosContext";

export function Historico() {
  const { laudos } = useLaudos();
  const [filters, setFilters] = useState({
    periodoInicio: "",
    periodoFim: "",
    produto: "",
    cliente: "",
    status: "",
  });

  const navigate = useNavigate();

  // Filtrar apenas laudos finalizados e aplicar filtros de busca
  const filteredLaudos = laudos.filter(l => l.statusLaudo === 'finalizado');

  const displayData = filteredLaudos.map(l => ({
    id: l.id,
    data: new Date(l.data).toLocaleDateString('pt-BR'),
    produto: l.produtos?.[0]?.descricao || "Vários produtos",
    cliente: l.cliente,
    nfGarantia: l.nfGarantia,
    status: "Finalizado",
    responsavel: "Admin",
    originalLaudo: l
  }));

  const handleVerLaudo = (item: any, aba: "cliente" | "interna") => {
    navigate("/nova-analise", { state: { ...item.originalLaudo, abaOrigem: aba } });
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
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setFilters({ periodoInicio: "", periodoFim: "", produto: "", cliente: "", status: "" })}>
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
            Histórico de Movimentações (Laudos Finalizados)
          </h3>
          <span className="text-sm text-gray-600">
            Total: {displayData.length} registros
          </span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NF Garantia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Nenhum laudo finalizado encontrado no histórico.
                    </td>
                  </tr>
                ) : (
                  displayData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.data}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{item.produto}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cliente}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nfGarantia}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium uppercase">
                          Finalizado
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerLaudo(item, "cliente")}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1 border border-blue-200"
                            title="Ver Laudo Cliente"
                          >
                            <FileText size={16} />
                            <span className="text-[10px] font-bold">CLIENTE</span>
                          </button>
                          <button
                            onClick={() => handleVerLaudo(item, "interna")}
                            className="p-1 text-slate-600 hover:bg-slate-50 rounded transition-colors flex items-center gap-1 border border-slate-200"
                            title="Ver Laudo Interno"
                          >
                            <Lock size={16} />
                            <span className="text-[10px] font-bold">INTERNO</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
