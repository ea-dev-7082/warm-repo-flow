import { useState, useMemo, useEffect } from "react";
import { Search, Truck, Building2, User, ArrowLeft, FileText, ClipboardList, Loader2, Check, PlayCircle, Lock, Save, History, Calendar, CheckSquare, Eye, Printer } from "lucide-react";
import { useLaudos } from "../contexts/LaudosContext";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
// FABRICANTES is now dynamic from context
import { toast } from "sonner";
import { DanfeMirror } from "./DanfeMirror";

export function TratamentoFornecedor() {
  const { laudos, loading, adicionarLaudo, atualizarLaudo, cadastros } = useLaudos();
  const manufacturers = (cadastros || [])
    .filter(c => c.classe === "fornecedor")
    .map(c => c.nome);

  const allCadastros = cadastros || [];

  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"buscar" | "laudo" | "historico">("buscar");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pending" | "finalized">("pending");

  // Local state for conference session
  const [isConferringLocally, setIsConferringLocally] = useState(false);
  const [localChecks, setLocalChecks] = useState<Record<string, boolean>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showMirrorModal, setShowMirrorModal] = useState(false);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>("");
  const [cadastrosLoading, setCadastrosLoading] = useState(false);
  const [naturezaOperacao, setNaturezaOperacao] = useState("DEVOLUÇÃO DE MERCADORIA OU DEMONSTRAÇÃO");
  const [productOverrides, setProductOverrides] = useState<Record<string, Record<string, string>>>({});
  const [selectedConferenceDate, setSelectedConferenceDate] = useState<string | null>(null);
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState("");

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
            // If mode is pending, show only items NOT YET conferido in DB
            // If mode is finalized, show items belonging to the selected session
            const shouldInclude = (viewMode === "pending" && !p.conferido) ||
              (viewMode === "finalized" && 
                (selectedConferenceDate 
                  ? p.data_conferencia === selectedConferenceDate 
                  : p.conferido // Fallback for legacy items or showing all if no date selected
                )
              );

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
  }, [laudos, selectedSupplier, isConferringLocally, localChecks, viewMode, selectedConferenceDate]);

  // Extract finalized conferences as separate sessions
  const conferencesHistory = useMemo(() => {
    const sessions: any[] = [];
    const sessionMap = new Map<string, { manufacturer: string, responsible: string, date: string }>();

    laudos.forEach(laudo => {
      if (laudo.produtos && Array.isArray(laudo.produtos)) {
        laudo.produtos.forEach((p: any) => {
          if (p.conferido && p.data_conferencia && p.fabricante) {
            let manufacturer = "";
            if (p.fabricante.startsWith('{')) {
              try {
                const parsed = JSON.parse(p.fabricante);
                manufacturer = Object.values(parsed).find(v => typeof v === 'string') as string || "";
              } catch {}
            } else {
              manufacturer = p.fabricante;
            }

            if (manufacturer) {
              const sessionKey = `${manufacturer.trim().toUpperCase()}-${p.data_conferencia}-${p.conferente}`;
              if (!sessionMap.has(sessionKey)) {
                sessionMap.set(sessionKey, {
                  manufacturer: manufacturer.trim(),
                  responsible: p.conferente || "Sistema",
                  date: p.data_conferencia
                });
              }
            }
          } else if (p.conferido && !p.data_conferencia && laudo.conferente_fabricante && p.fabricante) {
            // Legacy handling for items without data_conferencia
            let manufacturer = "";
            if (p.fabricante.startsWith('{')) {
              try {
                const parsed = JSON.parse(p.fabricante);
                manufacturer = Object.values(parsed).find(v => typeof v === 'string') as string || "";
              } catch {}
            } else {
              manufacturer = p.fabricante;
            }

            if (manufacturer && laudo.conferente_fabricante[manufacturer]) {
                const sessionKey = `${manufacturer.trim().toUpperCase()}-legacy-${laudo.id}`;
                if (!sessionMap.has(sessionKey)) {
                  sessionMap.set(sessionKey, {
                    manufacturer: manufacturer.trim(),
                    responsible: laudo.conferente_fabricante[manufacturer] as string,
                    date: laudo.data
                  });
                }
            }
          }
        });
      }
    });

    return Array.from(sessionMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [laudos]);

  const conferenceStartedBy = useMemo(() => {
    if (!selectedSupplier) return null;
    for (const laudo of laudos) {
      if (laudo.conferente_fabricante?.[selectedSupplier]) {
        return laudo.conferente_fabricante[selectedSupplier];
      }
    }
    return null;
  }, [laudos, selectedSupplier]);

  const filteredConferencesHistory = useMemo(() => {
    return conferencesHistory.filter(item => {
      const matchesSearch = item.manufacturer.toLowerCase().includes(historySearchTerm.toLowerCase());
      const matchesDate = !historyDateFilter || item.date.startsWith(historyDateFilter);
      return matchesSearch && matchesDate;
    });
  }, [conferencesHistory, historySearchTerm, historyDateFilter]);

  // Props for the DANFE Mirror, extracted for reuse in preview and background printing
  const mirrorProps = useMemo(() => {
    if (!selectedSupplier || viewMode !== "finalized") return null;

    const supplierInfo = allCadastros.find(c =>
      (c.nome.trim().toUpperCase() === selectedSupplier?.trim().toUpperCase() ||
        c.nome.trim().toUpperCase().includes(selectedSupplier?.trim().toUpperCase() || "")) &&
      (c.classe === "fornecedor")
    );

    const carrierInfo = allCadastros.find(c => c.cnpj === selectedCarrierId);

    const issuerInfo = allCadastros.find(c => 
      c.nome.trim().toUpperCase() === profile?.empresa?.trim().toUpperCase() ||
      c.nome.toUpperCase().includes("AUTOMOTRIZ")
    );

    // 1. Get all products with individual overrides applied
    const rawProductsWithOverrides = supplierProducts.map((p, idx) => {
      const key = `${p.idLaudo}-${p.originalIdx}`;
      const overrides = productOverrides[key] || {};
      return {
        ...p,
        ...overrides,
        originalKey: key
      };
    });

    // 2. Group products
    const groupedMap = new Map<string, any>();

    rawProductsWithOverrides.forEach(p => {
      // Grouping key: code, ncm, unit, unitValue, cfop, cst
      const groupKey = `${p.codigo}|${p.ncm || ""}|${p.unidade || ""}|${p.vUnit || ""}|${p.cfop || ""}|${p.cst || ""}`;
      
      if (groupedMap.has(groupKey)) {
        const group = groupedMap.get(groupKey);
        
        const currentQty = parseFloat(String(group.quantidade).replace(',', '.')) || 0;
        const pQty = parseFloat(String(p.quantidade).replace(',', '.')) || 0;
        group.quantidade = (currentQty + pQty).toString().replace('.', ',');

        const currentTotal = parseFloat(String(group.vProd).replace(',', '.')) || 0;
        const pTotal = parseFloat(String(p.vProd).replace(',', '.')) || 0;
        group.vProd = (currentTotal + pTotal).toFixed(2).replace('.', ',');

        group.originalKeys.push(p.originalKey);
      } else {
        groupedMap.set(groupKey, {
          ...p,
          originalKeys: [p.originalKey]
        });
      }
    });

    const aggregatedProducts = Array.from(groupedMap.values());

    const complementaryInfoLabels = Array.from(new Set(supplierProducts.map(p => p.laudoCliente))).join(", ");

    return {
      issuer: issuerInfo,
      recipient: supplierInfo,
      carrier: carrierInfo,
      products: aggregatedProducts,
      responsible: conferenceStartedBy || profile?.nome || "",
      complementaryInfo: complementaryInfoLabels,
      naturezaOperacao,
      onNaturezaChange: setNaturezaOperacao,
      onProductChange: (index: number, field: string, value: string) => {
        const group = aggregatedProducts[index];
        const keysToUpdate = group.originalKeys;

        setProductOverrides(prev => {
          const newOverrides = { ...prev };
          
          keysToUpdate.forEach((key: string) => {
            const currentOverrides = newOverrides[key] || {};
            const itemOriginal = supplierProducts.find(sp => `${sp.idLaudo}-${sp.originalIdx}` === key);
            
            const updated = { ...currentOverrides, [field]: value };

            // Re-calculate vProd for each item in the group if quantity or unit value changed
            // NOTE: If quantity of the GROUP row changed, it's tricky. 
            // For now, if user edits quantity of a grouped row, we apply that value to each item? 
            // Probably not what's intended. Usually quantity is not edited on grouped rows unless it's to fix something.
            // If they change quantity on a grouped row from e.g. "10" to "5", we don't know which items to reduce.
            // But usually DANFE quantity is fixed from XML.
            
            if (field === 'quantidade' || field === 'vUnit') {
              const qtyStr = String(field === 'quantidade' ? value : (updated.quantidade || itemOriginal?.quantidade || "0"));
              const unitValStr = String(field === 'vUnit' ? value : (updated.vUnit || itemOriginal?.vUnit || "0"));

              const qtyNum = parseFloat(qtyStr.replace(',', '.')) || 0;
              const unitValNum = parseFloat(unitValStr.replace(',', '.')) || 0;
              const total = qtyNum * unitValNum;

              if (!isNaN(total)) {
                updated.vProd = total.toFixed(2).replace('.', ',');
              }
            }

            newOverrides[key] = updated;
          });

          return newOverrides;
        });
      }
    };
  }, [selectedSupplier, viewMode, allCadastros, selectedCarrierId, profile, supplierProducts, productOverrides, naturezaOperacao, conferenceStartedBy]);

  const filteredSuppliers = manufacturers.filter(s =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSupplier = (supplier: string, mode: "pending" | "finalized" = "pending", conferenceDate: string | null = null) => {
    setSelectedSupplier(supplier);
    setViewMode(mode);
    setSelectedConferenceDate(conferenceDate);
    setActiveTab("laudo");
    setIsConferringLocally(false);
    setLocalChecks({});
  };

  // fetchCadastros is now handled by LaudosContext

  const handlePrint = () => {
    if (!mirrorProps || !mirrorProps.products) return;

    const invalidItems = mirrorProps.products.filter(p => !p.cst || !p.cfop || !p.quantidade);
    
    if (invalidItems.length > 0) {
      const codes = Array.from(new Set(invalidItems.map(p => p.codigo))).join(", ");
      toast.error(`Impressão bloqueada! Os itens (${codes}) estão com campos obrigatórios vazios (CST, CFOP ou Qtd). Por favor, preencha-os antes de imprimir.`);
      return;
    }

    if (!selectedCarrierId) {
      toast.error("Selecione uma transportadora para o espelho.");
      return;
    }

    window.print();
  };


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
      const sessionTimestamp = new Date().toISOString();
      const laudoIds = Array.from(new Set(supplierProducts.map(p => p.idLaudo)));

      const promises = laudoIds.map(async (id) => {
        const laudo = laudos.find(l => l.id === id);
        if (!laudo || !laudo.produtos) return;

        let hasChange = false;
        const updatedProdutos = laudo.produtos.map((p, idx) => {
          const key = `${id}-${idx}`;
          if (localChecks.hasOwnProperty(key)) {
            const isCheckedNow = !!localChecks[key];
            // If item is being checked in this session, assign it to the session
            if (isCheckedNow && !p.conferido) {
              hasChange = true;
              return { 
                ...p, 
                conferido: true, 
                data_conferencia: sessionTimestamp,
                conferente: profile.nome,
                conferenteId: user?.id
              };
            }
            // If it was already checked and we are toggling it OFF (less likely but possible)
            if (!isCheckedNow && p.conferido) {
               hasChange = true;
               const { conferido, data_conferencia, conferente, ...rest } = p;
               return rest;
            }
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


  return (
    <div className={`space-y-6 ${showMirrorModal ? "mirror-open" : ""}`}>
      <style>{`
        @media print {
          /* Hide EVERYTHING global first */
          aside, header, nav, footer, .no-print, button, .tabs-header {
            display: none !important;
          }

          /* Reset the body and html to allow full document flow */
          body, html {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          /* Force the list view to be hidden when we want to print the mirror */
          .content-wrapper {
            display: none !important;
          }

          /* Show the print-only mirror */
          .print-only-danfe {
            display: block !important;
            width: 100% !important;
          }
          
          .mirror-open-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            z-index: 9999 !important;
          }

          /* Remove all modal chrome styling */
          .mirror-modal-print {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          /* Hide modal internal header and footer */
          .mirror-modal-print > div:first-child,
          .mirror-modal-print > div:last-child {
            display: none !important;
          }

          /* Ensure the content area is visible and takes up space */
          .mirror-modal-print > div:nth-child(2) {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }

          @page {
            margin: 1.5cm;
            size: auto;
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
              <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Histórico de Conferências</h3>
                  <p className="text-sm text-gray-500">Lista de fornecedores que já tiveram laudos conferidos e salvos.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Filtrar fornecedor..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="date"
                      value={historyDateFilter}
                      onChange={(e) => setHistoryDateFilter(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    />
                  </div>
                  {(historySearchTerm || historyDateFilter) && (
                    <button
                      onClick={() => {
                        setHistorySearchTerm("");
                        setHistoryDateFilter("");
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>
              </div>

              {filteredConferencesHistory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredConferencesHistory.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSupplier(item.manufacturer, "finalized", item.date)}
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
                              <span>Última Conferência: <strong>{new Date(item.date).toLocaleString('pt-BR')}</strong></span>
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
                        onClick={() => {
                          if (!selectedCarrierId) {
                            toast.error("Selecione uma transportadora para o espelho.");
                            return;
                          }
                          handlePrint();
                        }}
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
                  c.classe === "fornecedor"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300 mirror-open-container">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] overflow-hidden flex flex-col max-h-[95vh] mirror-modal-print">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Espelho de Nota Fiscal (DANFE)</h3>
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

            <div className="p-4 overflow-y-auto flex-1 bg-white">
              {mirrorProps && (
                <DanfeMirror {...mirrorProps} />
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 no-print">
              <button
                onClick={handlePrint}
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
      {viewMode === "finalized" && mirrorProps && (
        <div className="print-only-danfe hidden">
          <DanfeMirror {...mirrorProps} />
        </div>
      )}
    </div>
  );
}
