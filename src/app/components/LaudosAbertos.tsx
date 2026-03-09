import { useNavigate } from "react-router-dom";
import { Plus, Search, FileEdit, Trash2, CheckCircle, FileText, Lock } from "lucide-react";
import { useLaudos } from "../contexts/LaudosContext";
import { toast } from "sonner";

export function LaudosAbertos() {
    const navigate = useNavigate();
    const { laudos, removerLaudo, atualizarLaudo } = useLaudos();

    // Filtrar apenas os laudos em aberto
    const laudosExibidos = laudos
        .filter(l => l.statusLaudo === 'aberto')
        .map(l => ({
            id: l.id,
            cliente: l.cliente,
            produto: l.produtos?.[0]?.descricao || "Vários produtos", // Pega o primeiro como resumo
            nfGarantia: l.nfGarantia,
            status: 'Em aberto',
            data: new Date(l.data).toLocaleDateString('pt-BR'),
        }));

    const columns = [
        { key: "id", label: "ID Laudo" },
        { key: "cliente", label: "Cliente" },
        { key: "nfGarantia", label: "NF Garantia" },
        { key: "produto", label: "Produto(s)" },
        { key: "status", label: "Status" },
        { key: "data", label: "Data" },
    ];

    const handleEdit = (item: any, aba: "cliente" | "interna" | "analise" = "analise") => {
        const laudoCompleto = laudos.find(l => l.id === item.id);
        navigate("/nova-analise", { state: { ...laudoCompleto, abaOrigem: aba } });
    };

    const handleFecharLaudo = (item: any) => {
        if (window.confirm("Deseja fechar este laudo e marcá-lo como finalizado? O laudo irá para o Histórico e sairá desta tela em breve.")) {
            atualizarLaudo(item.id, { statusLaudo: 'finalizado' });
            toast.success("Laudo marcado como finalizado!");
        }
    };

    const handleDelete = (item: any) => {
        if (window.confirm("Deseja realmente excluir este laudo em aberto?")) {
            removerLaudo(item.id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Laudos Abertos</h1>
                    <p className="text-gray-500 mt-1">Gerencie as análises de garantia em andamento e finalizadas recentemente.</p>
                </div>
                <button
                    onClick={() => navigate("/nova-analise")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Nova Análise
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, NF ou status..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                        <option value="todos">Todos os status</option>
                        <option value="aberto">Em aberto</option>
                        <option value="finalizado">Finalizados</option>
                    </select>
                </div>

                {laudosExibidos.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 text-sm font-semibold text-gray-600">
                                    {columns.map((col) => (
                                        <th key={col.key} className="pb-3 px-4">{col.label}</th>
                                    ))}
                                    <th className="pb-3 px-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {laudosExibidos.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-4 text-sm font-medium text-gray-900">{item.id}</td>
                                        <td className="py-4 px-4 text-sm text-gray-600">{item.cliente}</td>
                                        <td className="py-4 px-4 text-sm text-gray-600">{item.nfGarantia}</td>
                                        <td className="py-4 px-4 text-sm text-gray-600 truncate max-w-[200px]">{item.produto}</td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'Finalizado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-sm text-gray-600">{item.data}</td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.status !== 'Finalizado' && (
                                                    <button
                                                        onClick={() => handleFecharLaudo(item)}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Fechar Laudo (Marcar como Finalizado)"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {item.status === 'Finalizado' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(item, "cliente")}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                                            title="Ver Laudo Cliente"
                                                        >
                                                            <FileText size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(item, "interna")}
                                                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1"
                                                            title="Ver Laudo Interno"
                                                        >
                                                            <Lock size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEdit(item, "analise")}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Continuar Análise"
                                                    >
                                                        <FileEdit size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Nenhum laudo encontrado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
