import { useState, useMemo, useEffect } from "react";
import { Search, Truck, Building2, User, ArrowLeft, FileText, ClipboardList, Loader2, Check, PlayCircle, Lock, Save, History, Calendar, CheckSquare, Eye, Printer } from "lucide-react";
import { FABRICANTES } from "../constants/suppliers";
import { useLaudos } from "../contexts/LaudosContext";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function TratamentoFornecedor() {
  const { laudos, loading, atualizarLaudo } = useLaudos();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"buscar" | "laudo" | "historico">("buscar");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pending" | "finalized">("pending");

  // Local state for conference session
  const [isConferringLocally, setIsConferringLocally] = useState(false);
  const [localChecks, setLocalChecks] = useState<Record<string, boolean>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showMirrorModal, setShowMirrorModal] = useState(false);
  const [allCadastros, setAllCadastros] = useState<any[]>([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>("");
  const [cadastrosLoading, setCadastrosLoading] = useState(false);

  const filteredSuppliers = FABRICANTES.filter(s =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSupplier = (supplier: string, mode: "pending" | "finalized" = "pending") => {
    setSelectedSupplier(supplier);
    setViewMode(mode);
    setActiveTab("laudo");
    setIsConferringLocally(false);
    setLocalChecks({});
  };

  useEffect(() => {
    fetchCadastros();
  }, []);

  const fetchCadastros = async () => {
    setCadastrosLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("cadastros")
        .select("*");
      if (error) throw error;
      setAllCadastros(data || []);
    } catch (error: any) {
      console.error("Error fetching cadastros:", error);
    } finally {
      setCadastrosLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const conferenceStartedBy = useMemo(() => {
    if (!selectedSupplier) return null;
    for (const laudo of laudos) {
      if (laudo.conferente_fabricante?.[selectedSupplier]) {
        return laudo.conferente_fabricante[selectedSupplier];
      }
    }
    return null;
  }, [laudos, selectedSupplier]);

  const handleStartConference = () => {
    if (!selectedSupplier || !profile?.nome) return;

    // In partitioning mode, starting a conference and checking items 
    // means they will leave the "pending" view once saved.
    const initialChecks: Record<string, boolean> = {};
    supplierProducts.forEach(p => {
      if (p.conferido) {
        initialChecks[`${p.idLaudo}-${p.originalIdx}`] = true;
      }
    });

    setLocalChecks(initialChecks);
    setIsConferringLocally(true);
    toast.info("Conferência iniciada. Marque os itens e clique em FINALIZAR.");
  };

  const handleToggleLocalCheck = (idLaudo: string, productIdxAtLaudo: number) => {
    const key = `${idLaudo}-${productIdxAtLaudo}`;
    setLocalChecks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFinalizeConference = async () => {
    if (!selectedSupplier || !profile?.nome) return;

    setIsFinalizing(true);
    try {
      // Find all products that were either ALREADY checked in DB or are NOW checked in local state
      const laudoIds = Array.from(new Set(supplierProducts.map(p => p.idLaudo)));

      const promises = laudoIds.map(async (id) => {
        const laudo = laudos.find(l => l.id === id);
        if (!laudo || !laudo.produtos) return;

        let hasChange = false;
        const updatedProdutos = laudo.produtos.map((p, idx) => {
          const key = `${id}-${idx}`;
          if (localChecks.hasOwnProperty(key)) {
            const newValue = !!localChecks[key];
            if (p.conferido !== newValue) hasChange = true;
            return { ...p, conferido: newValue };
          }
          return p;
        });

        const currentConferentes = laudo.conferente_fabricante || {};
        const newConferentes = {
          ...currentConferentes,
          [selectedSupplier]: profile.nome
        };

        return atualizarLaudo(id, {
          produtos: updatedProdutos,
          conferente_fabricante: newConferentes
        });
      });

      await Promise.all(promises);
      setIsConferringLocally(false);
      toast.success(`Conferência de ${selectedSupplier} finalizada! Os itens foram enviados para o histórico.`);
    } catch (error) {
      console.error("Erro ao finalizar conferência:", error);
      toast.error("Falha ao salvar conferência");
    } finally {
      setIsFinalizing(false);
    }
  };

  // Extract all products for the selected supplier from all laudos
  const supplierProducts = useMemo(() => {
    if (!selectedSupplier) return [];

    const products: any[] = [];
    laudos.forEach(laudo => {
      if (laudo.produtos && Array.isArray(laudo.produtos)) {
        laudo.produtos.forEach((p, idx) => {
          let isMatch = false;

          if (p.fabricante) {
            if (p.fabricante.startsWith('{')) {
              try {
                const parsed = JSON.parse(p.fabricante);
                isMatch = Object.values(parsed).some(val =>
                  typeof val === 'string' && val.trim().toUpperCase() === selectedSupplier.trim().toUpperCase()
                );
              } catch (e) {
                console.error("Error parsing manufacturer JSON", e);
              }
            } else {
              isMatch = p.fabricante.trim().toUpperCase() === selectedSupplier.trim().toUpperCase();
            }
          }

          if (isMatch) {
            const key = `${laudo.id}-${idx}`;
            const currentConferido = isConferringLocally ? !!localChecks[key] : !!p.conferido;

            // Partitioning logic:
            // If mode is pending, show only NOT conferido
            // If mode is finalized, show only conferido
            const shouldInclude = (viewMode === "pending" && !currentConferido) ||
              (viewMode === "finalized" && currentConferido) ||
              (isConferringLocally && viewMode === "pending"); // Keep items visible while toggling in local session

            if (shouldInclude) {
              products.push({
                ...p,
                conferido: currentConferido,
                laudoCliente: laudo.cliente,
                laudoNfGarantia: laudo.nfGarantia,
                laudoData: laudo.data,
                idLaudo: laudo.id,
                originalIdx: idx
              });
            }
          }
        });
      }
    });
    return products;
  }, [laudos, selectedSupplier, isConferringLocally, localChecks, viewMode]);

  // Extract finalized conferences
  const conferencesHistory = useMemo(() => {
    const history: Record<string, { manufacturer: string, responsible: string, date: string }> = {};

    laudos.forEach(laudo => {
      if (laudo.conferente_fabricante) {
        Object.entries(laudo.conferente_fabricante).forEach(([manufacturer, responsible]) => {
          // A manufacturer is in history only if it has at least one conferido=true product in any laudo
          const hasConferidoProduct = laudo.produtos?.some((p: any) => {
            // Check if product belongs to this manufacturer and is checked
            if (p.conferido !== true) return false;
            if (p.fabricante?.startsWith('{')) {
              try {
                const parsed = JSON.parse(p.fabricante);
                return Object.values(parsed).some(val =>
                  typeof val === 'string' && val.trim().toUpperCase() === manufacturer.trim().toUpperCase()
                );
              } catch { return false; }
            }
            return p.fabricante?.trim().toUpperCase() === manufacturer.trim().toUpperCase();
          });

          if (hasConferidoProduct) {
            if (!history[manufacturer] || laudo.data > history[manufacturer].date) {
              history[manufacturer] = {
                manufacturer,
                responsible: responsible as string,
                date: laudo.data
              };
            }
          }
        });
      }
    });

    return Object.values(history).sort((a, b) => b.date.localeCompare(a.date));
  }, [laudos]);

  return (
    <div className={`space-y-6 ${showMirrorModal ? "mirror-open" : ""}`}>
      <style>{`
        @media print {
          /* Hide EVERYTHING by default */
          body * {
            visibility: hidden;
          }
          /* Show ONLY the mirror modal if the container has mirror-open */
          .mirror-open .mirror-modal-print, .mirror-open .mirror-modal-print * {
            visibility: visible !important;
          }
          /* Show conference table ONLY if mirror is NOT open */
          :not(.mirror-open) .printable-content, :not(.mirror-open) .printable-content * {
            visibility: visible !important;
          }
          /* Position correctly */
          .printable-content, .mirror-modal-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
          }
          /* Hide specific UI elements */
          .no-print, button, .tabs-header, .fixed, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Reset margins and background for printing */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          /* Professional table for printing */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10pt !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
          }
          th {
            background-color: #f8f9fa !important;
          }
          /* Signature fixed at bottom */
          .signature-section {
            margin-top: 50px !important;
            page-break-inside: avoid !important;
          }
          /* Remove page titles/dates added by browsers */
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden content-wrapper">
        {/* Tabs Header */}
        <div className="flex gap-1 border-b border-gray-200 px-4 bg-gray-50/50 tabs-header">
          <button
            onClick={() => {
              if (isConferringLocally) {
                if (confirm("Você tem uma conferência em andamento. Se sair agora, as alterações locais serão perdidas. Deseja sair?")) {
                  setActiveTab("buscar");
                  setIsConferringLocally(false);
                }
              } else {
                setActiveTab("buscar");
              }
            }}
            className={`px-4 py-3 font-medium transition-colors relative text-sm ${activeTab === "buscar" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <div className="flex items-center gap-2">
              <Search size={16} />
              Buscar Fornecedores
            </div>
            {activeTab === "buscar" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>

          <button
            onClick={() => {
              if (isConferringLocally) {
                if (confirm("Você tem uma conferência em andamento. Se sair agora, as alterações locais serão perdidas. Deseja sair?")) {
                  setActiveTab("historico");
                  setIsConferringLocally(false);
                }
              } else {
                setActiveTab("historico");
              }
            }}
            className={`px-4 py-3 font-medium transition-colors relative text-sm ${activeTab === "historico" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
          >
            <div className="flex items-center gap-2">
              <History size={16} />
              Conferências Realizadas
            </div>
            {activeTab === "historico" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>

          {selectedSupplier && (
            <button
              onClick={() => setActiveTab("laudo")}
              className={`px-4 py-3 font-medium transition-colors relative text-sm ${activeTab === "laudo" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
            >
              <div className="flex items-center gap-2">
                <FileText size={16} />
                {viewMode === "pending" ? "Conferência Fabricante" : "Visualizar Conferência"}
              </div>
              {activeTab === "laudo" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          )}
        </div>

        <div className="p-6">
          {activeTab === "buscar" && (
            <div className="space-y-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Nome do fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((supplier, index) => (
                  <div
                    key={index}
                    onClick={() => handleSelectSupplier(supplier, "pending")}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Truck size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 leading-tight mb-1 truncate">{supplier}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Building2 size={14} />
                          <span>Fornecedor Homologado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredSuppliers.length === 0 && (
                  <div className="col-span-full py-16 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <div className="text-gray-400 mb-2">
                      <Search size={48} className="mx-auto opacity-20" />
                    </div>
                    <p className="text-gray-500">Nenhum fornecedor encontrado para "{searchTerm}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "historico" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">Histórico de Conferências</h3>
                <p className="text-sm text-gray-500">Lista de fornecedores que já tiveram laudos conferidos e salvos.</p>
              </div>

              {conferencesHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {conferencesHistory.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSupplier(item.manufacturer, "finalized")}
                      className="p-5 bg-white border border-gray-200 rounded-xl hover:border-green-400 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <CheckSquare size={24} />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                              Finalizado
                            </span>
                            <div className="flex items-center gap-1 text-blue-600 text-[10px] font-bold">
                              <Eye size={12} />
                              Ver Itens
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 leading-tight mb-3 truncate">{item.manufacturer}</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <User size={14} />
                              <span>Responsável: <strong>{item.responsible}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar size={14} />
                              <span>Última Conferência: <strong>{new Date(item.date).toLocaleDateString('pt-BR')}</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <History size={48} className="mx-auto text-gray-300 mb-4" />
                  <h4 className="font-semibold text-gray-800">Nenhuma conferência finalizada</h4>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                    Assim que você finalizar e salvar um laudo de fabricante, ele aparecerá aqui com os itens conferidos.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "laudo" && selectedSupplier && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (isConferringLocally) {
                        if (confirm("Descartar alterações locais?")) {
                          setActiveTab("buscar");
                          setIsConferringLocally(false);
                        }
                      } else {
                        setActiveTab(viewMode === "pending" ? "buscar" : "historico");
                      }
                    }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 no-print"
                    title="Voltar"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedSupplier}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Conferência de Garantia do Fabricante</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${viewMode === "pending" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"} no-print`}>
                        {viewMode === "pending" ? "Itens Pendentes" : "Itens Conferidos"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 no-print">
                  {viewMode === "finalized" && (
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedCarrierId}
                        onChange={(e) => setSelectedCarrierId(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      >
                        <option value="">Selecionar Transportadora...</option>
                        {allCadastros
                          .filter(c => c.classe === "transportadora")
                          .map(c => (
                            <option key={c.cnpj} value={c.cnpj}>{c.nome}</option>
                          ))
                        }
                      </select>
                      <button
                        onClick={() => {
                          if (!selectedCarrierId) {
                            toast.error("Selecione uma transportadora para o espelho.");
                            return;
                          }
                          setShowMirrorModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-bold text-sm shadow-sm active:scale-95 no-print"
                      >
                        <FileText size={18} />
                        Visualizar Espelho NF
                      </button>
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-all font-bold text-sm shadow-md active:scale-95"
                      >
                        <Printer size={18} />
                        Imprimir / PDF
                      </button>
                    </div>
                  )}

                  {viewMode === "pending" && !isConferringLocally && supplierProducts.length > 0 && (
                    <button
                      onClick={handleStartConference}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-bold text-sm shadow-md active:scale-95"
                    >
                      <PlayCircle size={18} />
                      Começar Conferência
                    </button>
                  )}

                  {isConferringLocally && (
                    <button
                      onClick={handleFinalizeConference}
                      disabled={isFinalizing}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold text-sm shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {isFinalizing ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Save size={18} />
                      )}
                      Finalizar e Salvar
                    </button>
                  )}
                </div>
              </div>

              {/* Detailed Supplier Information Card */}
              {(() => {
                const supplierInfo = allCadastros.find(c =>
                  (c.nome.trim().toUpperCase() === selectedSupplier?.trim().toUpperCase() ||
                    c.nome.trim().toUpperCase().includes(selectedSupplier?.trim().toUpperCase() || "")) &&
                  (c.classe === "fornecedor" || c.classe === "Fornecedor")
                );
                if (!supplierInfo) return null;
                return (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 animate-in fade-in slide-in-from-top-2 duration-500 no-print">
                    <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                      <Building2 size={18} className="text-gray-400" />
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dados Cadastrais do Fornecedor</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-gray-400 font-medium mb-0.5">CNPJ</p>
                        <p className="font-bold text-gray-900">{supplierInfo.cnpj}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium mb-0.5">Inscrição Estadual</p>
                        <p className="font-bold text-gray-900">{supplierInfo.inscricao_estadual || "ISENTO"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-gray-400 font-medium mb-0.5">Endereço Completo</p>
                        <p className="font-bold text-gray-900">
                          {supplierInfo.endereco}{supplierInfo.numero ? `, ${supplierInfo.numero}` : ""}{supplierInfo.bairro ? ` - ${supplierInfo.bairro}` : ""}
                          {supplierInfo.cidade ? ` - ${supplierInfo.cidade}` : ""}{supplierInfo.uf ? `/${supplierInfo.uf}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium mb-0.5">CEP</p>
                        <p className="font-bold text-gray-900">{supplierInfo.cep || "-"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium mb-0.5">Telefone</p>
                        <p className="font-bold text-gray-900">{supplierInfo.fone || "-"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-gray-400 font-medium mb-0.5">E-mail</p>
                        <p className="font-bold text-gray-900">{supplierInfo.email || "-"}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Loader2 size={40} className="animate-spin mb-4" />
                  <p>Carregando dados dos laudos...</p>
                </div>
              ) : supplierProducts.length > 0 ? (
                <div className="space-y-8">
                  {isConferringLocally && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center gap-3 text-yellow-800 text-sm animate-pulse no-print">
                      <Lock size={18} className="flex-shrink-0" />
                      <p>Você está em <strong>modo de conferência</strong>. Ao finalizar, os itens marcados serão movidos para o histórico.</p>
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm printable-content">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-900 bg-white">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Cód. Produto</th>
                            <th className="px-4 py-3 font-semibold">Cliente</th>
                            <th className="px-4 py-3 font-semibold">NF Cliente</th>
                            <th className="px-4 py-3 font-semibold">Data Entrada</th>
                            <th className="px-4 py-3 font-semibold">Defeito Informado</th>
                            <th className="px-4 py-3 font-semibold">Data Etiqueta</th>
                            <th className="px-4 py-3 font-semibold text-center w-24 no-print">Conferido</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {supplierProducts.map((p, idx) => {
                            return (
                              <tr key={`${p.idLaudo}-${idx}`} className={`transition-colors ${p.conferido ? "bg-green-50/30" : "hover:bg-blue-50/30"}`}>
                                <td className="px-4 py-3 font-medium text-blue-700">{p.codigo}</td>
                                <td className="px-4 py-3">{p.laudoCliente}</td>
                                <td className="px-4 py-3">{p.laudoNfGarantia}</td>
                                <td className="px-4 py-3">{p.laudoData}</td>
                                <td className="px-4 py-3 italic text-gray-600 text-xs">
                                  {p.avaliacaoItem || "-"}
                                </td>
                                <td className="px-4 py-3 text-xs">{p.dataKit || "-"}</td>
                                <td className="px-4 py-3 text-center no-print">
                                  <button
                                    onClick={() => handleToggleLocalCheck(p.idLaudo, p.originalIdx)}
                                    disabled={!isConferringLocally}
                                    className={`p-2 rounded-lg transition-all ${p.conferido
                                        ? "bg-green-100 text-green-600 hover:bg-green-200"
                                        : isConferringLocally
                                          ? "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                                          : "bg-gray-50 text-gray-300 cursor-not-allowed"
                                      }`}
                                  >
                                    <Check size={18} className={p.conferido ? "stroke-[3px]" : ""} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-500 no-print">
                      Exibindo {supplierProducts.length} itens {viewMode === "pending" ? "pendentes" : "conferidos"}.
                    </div>
                  </div>

                  {/* Signature Section */}
                  {(conferenceStartedBy || isConferringLocally) && (
                    <div className="pt-12 pb-8 border-t border-gray-200 mt-12 flex justify-end animate-in fade-in duration-500 signature-section">
                      <div className="text-center min-w-[300px]">
                        <div className="h-[1px] bg-gray-400 w-full mb-2"></div>
                        <div className="text-sm font-bold text-gray-900 uppercase tracking-widest">
                          {isConferringLocally ? profile?.nome : conferenceStartedBy}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium uppercase mt-1">
                          Responsável pela Conferência - {selectedSupplier}
                        </div>
                        {isConferringLocally && (
                          <div className="text-[9px] text-blue-600 font-bold mt-1 italic no-print">
                            (Assinatura pendente de finalização)
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 no-print">
                  <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                  <h4 className="font-semibold text-gray-800">Nenhum item {viewMode === "pending" ? "pendente" : "conferido"}</h4>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto mt-1">
                    {viewMode === "pending"
                      ? `Todos os laudos registrados para o fornecedor ${selectedSupplier} já foram conferidos.`
                      : `Este fornecedor ainda não possui itens finalizados no histórico.`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NF Mirror Modal */}
      {showMirrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] mirror-modal-print">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Espelho de Nota Fiscal (Dados Cadastrais)</h3>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{selectedSupplier}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMirrorModal(false)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all text-2xl font-light"
              >
                &times;
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              {/* Remetente (Fornecedor) Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
                  <Building2 size={20} className="text-blue-600" />
                  <h4 className="text-sm font-bold text-blue-800 uppercase tracking-tighter">Remetente (Fornecedor)</h4>
                </div>
                {(() => {
                  const supplierInfo = allCadastros.find(c =>
                    (c.nome.trim().toUpperCase() === selectedSupplier?.trim().toUpperCase() ||
                      c.nome.trim().toUpperCase().includes(selectedSupplier?.trim().toUpperCase() || "")) &&
                    (c.classe === "fornecedor" || c.classe === "Fornecedor")
                  );
                  if (!supplierInfo) return <p className="text-xs text-red-500 italic">Dados do fornecedor não encontrados no cadastro master.</p>;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 font-mono text-xs">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Razão Social</p>
                        <p className="font-bold text-gray-900">{supplierInfo.nome}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">CNPJ</p>
                        <p className="font-bold text-gray-900">{supplierInfo.cnpj}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Inscrição Estadual</p>
                        <p className="font-bold text-gray-900">{supplierInfo.inscricao_estadual || "ISENTO"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Endereço</p>
                        <p className="font-bold text-gray-900">
                          {supplierInfo.endereco}{supplierInfo.numero ? `, ${supplierInfo.numero}` : ""}{supplierInfo.bairro ? ` - ${supplierInfo.bairro}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Cidade / UF / CEP</p>
                        <p className="font-bold text-gray-900">
                          {supplierInfo.cidade || ""}{supplierInfo.uf ? ` / ${supplierInfo.uf}` : ""} - CEP: {supplierInfo.cep || ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Telefone</p>
                        <p className="font-bold text-gray-900">{supplierInfo.fone || "-"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">E-mail</p>
                        <p className="font-bold text-gray-900">{supplierInfo.email || "-"}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Transportadora Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-green-100 pb-2">
                  <Truck size={20} className="text-green-600" />
                  <h4 className="text-sm font-bold text-green-800 uppercase tracking-tighter">Transportadora</h4>
                </div>
                {(() => {
                  const carrierInfo = allCadastros.find(c => c.cnpj === selectedCarrierId);
                  if (!carrierInfo) return <p className="text-xs text-gray-400 italic">Nenhuma transportadora selecionada.</p>;
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100 font-mono text-xs">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Razão Social</p>
                        <p className="font-bold text-gray-900">{carrierInfo.nome}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">CNPJ</p>
                        <p className="font-bold text-gray-900">{carrierInfo.cnpj}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Inscrição Estadual</p>
                        <p className="font-bold text-gray-900">{carrierInfo.inscricao_estadual || "ISENTO"}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Endereço</p>
                        <p className="font-bold text-gray-900">
                          {carrierInfo.endereco}{carrierInfo.numero ? `, ${carrierInfo.numero}` : ""}{carrierInfo.bairro ? ` - ${carrierInfo.bairro}` : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Cidade / UF / CEP</p>
                        <p className="font-bold text-gray-900">
                          {carrierInfo.cidade || ""}{carrierInfo.uf ? ` / ${carrierInfo.uf}` : ""} - CEP: {carrierInfo.cep || ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Telefone</p>
                        <p className="font-bold text-gray-900">{carrierInfo.fone || "-"}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Products Table Section */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ClipboardList size={20} className="text-gray-400" />
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-tighter">Itens Conferidos</h4>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 uppercase font-bold">
                      <tr>
                        <th className="px-4 py-3">Cód. Produto</th>
                        <th className="px-4 py-3">Descrição</th>
                        <th className="px-4 py-3 text-center">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 italic text-gray-600">
                      {supplierProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono font-bold text-blue-700">{p.codigo}</td>
                          <td className="px-4 py-3 truncate max-w-[300px]">{p.descricao || "Produto Garantia"}</td>
                          <td className="px-4 py-3 text-center font-bold text-gray-900">{p.quantidade || 1}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={2} className="px-4 py-4 text-right font-bold text-gray-900 text-sm italic">TOTAL DE ITENS CONFERIDOS:</td>
                        <td className="px-4 py-4 text-center font-bold text-blue-700 text-sm">
                          {supplierProducts.reduce((acc, p) => acc + Number(p.quantidade || 1), 0)} UNIDADES
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                <p className="text-[10px] text-yellow-800 font-medium">
                  <strong>Observação Legal:</strong> Este documento é um espelho para fins de conferência logística e não possui valor fiscal de Nota Fiscal Eletrônica (NF-e).
                  As informações acima foram extraídas dos laudos conferidos por {conferenceStartedBy || profile?.nome}.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all font-bold text-sm shadow-md"
              >
                Imprimir Espelho
              </button>
              <button
                onClick={() => setShowMirrorModal(false)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
