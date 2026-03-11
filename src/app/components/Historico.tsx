import { Search, FileText, Lock, Loader2, Upload, ExternalLink } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLaudos } from "../contexts/LaudosContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HistoricoRowProps {
  item: any;
  index: number;
  handleVerLaudo: (item: any, aba: "cliente" | "interna") => void;
}

function HistoricoRow({ item, index, handleVerLaudo }: HistoricoRowProps) {
  const [localNotaPaga, setLocalNotaPaga] = useState(item.originalLaudo.notaPaga || "");
  const { atualizarLaudo } = useLaudos();
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/\s+/g, " ") // Normaliza espaços
      .replace(/\b(ltda|me|eireli|s\/a|sa|epp)\b/g, "") // Remove extensões empresariais comuns
      .trim();
  };

  const validateInvoiceContent = async (file: File, expectedName: string): Promise<boolean> => {
    if (!file.name.toLowerCase().endsWith('.xml')) return true;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, "text/xml");
          
          // Busca o nome do destinatário no XML (padrão NFe)
          const destNameNode = xmlDoc.querySelector("dest > xNome");
          if (!destNameNode) {
            console.warn("Campo <xNome> do destinatário não encontrado no XML.");
            resolve(true); 
            return;
          }

          const foundName = destNameNode.textContent || "";
          const normalizedFound = normalizeName(foundName);
          const normalizedExpected = normalizeName(expectedName);

          // Verifica se o nome esperado está contido no nome encontrado (ou vice-versa)
          // Isso ajuda com variações parciais
          if (normalizedFound.includes(normalizedExpected) || normalizedExpected.includes(normalizedFound)) {
            resolve(true);
          } else {
            const confirmMsg = `Atenção: O nome na nota fiscal ("${foundName}") parece ser diferente do cliente no registro ("${expectedName}").\n\nDeseja anexar este arquivo assim mesmo?`;
            resolve(window.confirm(confirmMsg));
          }
        } catch (e) {
          console.error("Erro ao validar XML:", e);
          resolve(true);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValid = await validateInvoiceContent(file, item.cliente);
    if (!isValid) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsSaving(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${item.id}-${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('notas')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('notas')
        .getPublicUrl(filePath);

      await atualizarLaudo(item.id, { notaPaga: publicUrl });
      setLocalNotaPaga(publicUrl);
      toast.success("Nota anexada com sucesso!");
    } catch (error: any) {
      console.error("Erro detalhado ao fazer upload da nota:", error);
      
      let errorMsg = `Erro ao anexar: ${error.message || "Tente novamente"}`;
      
      if (error.message === 'bucket_not_found' || error.status === 404 || error.error === 'Bucket not found') {
        errorMsg = "Configuração pendente: O bucket 'notas' não foi encontrado no Supabase.";
      } else if (error.message?.toLowerCase().includes('row-level security') || error.message?.includes('RLS')) {
        errorMsg = "Erro de permissão: Verifique as políticas de RLS no bucket 'notas'.";
      }

      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
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
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <div className="flex items-center gap-2">
          {localNotaPaga && localNotaPaga.startsWith('http') ? (
            <div className="flex items-center gap-2">
              <a
                href={localNotaPaga}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs font-semibold"
                title="Visualizar Nota"
              >
                <ExternalLink size={16} />
                Ver Nota
              </a>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="text-gray-400 hover:text-gray-600 ml-2"
                title="Substituir Nota"
              >
                <Upload size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs transition-colors border border-gray-300 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload size={14} />}
              <span>Anexar Nota</span>
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".xml,pdf,image/*"
          />
        </div>
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
  );
}

export function Historico() {
  const { laudos, loading } = useLaudos();
  const [filters, setFilters] = useState({
    periodoInicio: "",
    periodoFim: "",
    produto: "",
    cliente: "",
    status: "",
    notaPaga: "",
  });

  const navigate = useNavigate();

  // Filtrar apenas laudos finalizados e aplicar filtros de busca
  const filteredLaudos = laudos.filter(l => {
    if (l.statusLaudo !== 'finalizado') return false;

    // Filtro de Período
    if (filters.periodoInicio) {
      const start = new Date(filters.periodoInicio);
      start.setHours(0, 0, 0, 0);
      if (new Date(l.data) < start) return false;
    }

    if (filters.periodoFim) {
      const end = new Date(filters.periodoFim);
      end.setHours(23, 59, 59, 999);
      if (new Date(l.data) > end) return false;
    }

    // Filtro de Produto
    if (filters.produto && !l.produtos?.some((p: any) =>
      p.descricao?.toLowerCase().includes(filters.produto.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(filters.produto.toLowerCase())
    )) {
      return false;
    }

    // Filtro de Cliente
    if (filters.cliente && !l.cliente?.toLowerCase().includes(filters.cliente.toLowerCase())) {
      return false;
    }

    // Filtro de Status (Se pelo menos um produto do laudo tem o status selecionado)
    if (filters.status && !l.produtos?.some((p: any) => p.status === filters.status)) {
      return false;
    }

    // Filtro de Nota Paga
    if (filters.notaPaga && !l.notaPaga?.toLowerCase().includes(filters.notaPaga.toLowerCase())) {
      return false;
    }

    return true;
  });

  const displayData = filteredLaudos.map(l => {
    let dataFormatada = "";
    try {
      if (l.data.includes('T')) {
        // ISO string do banco
        dataFormatada = new Date(l.data).toLocaleDateString('pt-BR');
      } else {
        // Formato YYYY-MM-DD vindo do formulário (evita shift de fuso)
        const [year, month, day] = l.data.split('-').map(Number);
        dataFormatada = new Date(year, month - 1, day).toLocaleDateString('pt-BR');
      }
    } catch (e) {
      dataFormatada = l.data;
    }

    return {
      id: l.id,
      data: dataFormatada,
      produto: l.produtos?.[0]?.descricao || "Vários produtos",
      cliente: l.cliente,
      nfGarantia: l.nfGarantia,
      status: "Finalizado",
      responsavel: l.responsavel || "Admin",
      originalLaudo: l
    };
  });

  const handleVerLaudo = (item: any, aba: "cliente" | "interna") => {
    navigate(`/laudo/${item.id}`, { state: { ...item.originalLaudo, abaOrigem: aba } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nota Paga
            </label>
            <input
              type="text"
              value={filters.notaPaga}
              onChange={(e) =>
                setFilters({ ...filters, notaPaga: e.target.value })
              }
              placeholder="Nº Nota..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setFilters({ periodoInicio: "", periodoFim: "", produto: "", cliente: "", status: "", notaPaga: "" })}>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Paga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      Nenhum laudo finalizado encontrado no histórico.
                    </td>
                  </tr>
                ) : (
                  displayData.map((item, index) => (
                    <HistoricoRow
                      key={item.id}
                      item={item}
                      index={index}
                      handleVerLaudo={handleVerLaudo}
                    />
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
