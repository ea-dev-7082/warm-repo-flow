import { ArrowLeft, Printer, Download, Lock, FileText, Loader2 } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { useLaudos } from "../contexts/LaudosContext";
import { supabase } from "@/integrations/supabase/client";
// @ts-ignore
import html2pdf from 'html2pdf.js';

export function WarrantyReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { laudos, loading } = useLaudos();
  const [dynamicData, setDynamicData] = useState<any>(location.state);
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"cliente" | "interna">(
    location.state?.abaOrigem === "interna" ? "interna" : "cliente"
  );
  
  const [reportSettings, setReportSettings] = useState({
    company_name: "Automotriz Indústria e Comércio de Peças Automotivas",
    department: "Departamento de Qualidade e Garantia",
    phone: "(21) 96480-3390"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          // @ts-ignore
          .from("app_settings")
          .select("*");
        
        if (!error && data && data.length > 0) {
          const newSettings = { ...reportSettings };
          data.forEach((s: any) => {
            if (s.key in newSettings) {
              // @ts-ignore
              newSettings[s.key] = s.value;
            }
          });
          setReportSettings(newSettings);
        }
      } catch (e) {}
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchTechnicianProfile = async () => {
      const respId = dynamicData?.responsavel_id || dynamicData?.responsavelId;
      if (!respId) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("sig_empresa, sig_departamento, sig_telefone")
          .eq("user_id", respId)
          .single();
        
        if (!error && data) {
          setReportSettings(prev => ({
            // @ts-ignore
            company_name: data.sig_empresa || prev.company_name,
            // @ts-ignore
            department: data.sig_departamento || prev.department,
            // @ts-ignore
            phone: data.sig_telefone || prev.phone
          }));
        }
      } catch (e) {}
    };
    
    if (dynamicData) {
      fetchTechnicianProfile();
    }
  }, [dynamicData]);

  useEffect(() => {
    if (!dynamicData && id && laudos.length > 0) {
      const found = laudos.find(l => l.id === id);
      if (found) setDynamicData(found);
    }
  }, [id, laudos, dynamicData]);

  if (loading && !dynamicData) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dynamicData) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] space-y-4">
        <p className="text-gray-500 font-medium">Laudo não encontrado.</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Voltar</button>
      </div>
    );
  }

  const dataFormatada = (() => {
    try {
      const d = dynamicData.data;
      if (!d) return "";
      if (d.includes('T')) {
        return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase();
      } else {
        const [year, month, day] = d.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase();
      }
    } catch (e) {
      return dynamicData.data || "";
    }
  })();

  const groupedProdutosCliente = dynamicData.produtos
    ?.reduce((acc: any[], p: any) => {
      let statusLabel = '-';
      if (!p.recebido) {
        statusLabel = 'NÃO RECEBIDO';
      } else {
        statusLabel = p.status === 'procedente' ? 'PROCEDENTE' : (p.status === 'nao-procedente' ? 'NÃO PROCEDENTE' : '-');
      }

      const item = p.itemAvaliado || '-';
      const referencia = p.referencia || '-';
      const acao = p.acao || '-';
      const avaliacao = p.avaliacaoItem || '-';

      const existing = acc.find((x: any) =>
        x.codigo === p.codigo &&
        x.status === statusLabel &&
        x.item === item &&
        x.avaliacao === avaliacao &&
        x.referencia === referencia &&
        x.acao === acao
      );

      const qty = Number(p.quantidadeRecebida || p.quantidade || 0);

      if (existing) {
        existing.qtde += qty;
      } else {
        acc.push({
          codigo: p.codigo,
          qtde: qty,
          status: statusLabel,
          item: item,
          avaliacao: avaliacao,
          referencia: referencia,
          acao: acao
        });
      }
      return acc;
    }, []) || [];

  const groupedProdutosInterna = dynamicData.produtos
    ?.reduce((acc: any[], p: any) => {
      let statusLabel = '-';
      if (!p.recebido) {
        statusLabel = 'NÃO RECEBIDO';
      } else {
        statusLabel = p.status === 'procedente' ? 'PROCEDENTE' : (p.status === 'nao-procedente' ? 'NÃO PROCEDENTE' : '-');
      }

      const item = p.itemAvaliado || '-';
      const itemReap = p.itemReaproveitado || '-';
      const avaliacao = p.avaliacaoItem || '-';
      const acao = p.acao || '-';
      const descricao = p.descricao || '-';
      const nf = p.nfInterna || '-';
      const referencia = p.referencia || '-';
      const dataKit = p.dataKit || '-';
      let parsedFabStr = p.fabricante || '-';
      try {
        if (typeof p.fabricante === 'string' && p.fabricante.startsWith('{')) {
          const parsed = JSON.parse(p.fabricante);
          const entries = Object.entries(parsed).filter(([_, v]) => v);
          if (entries.length > 0) {
            parsedFabStr = entries.map(([k, v]) => `${k}: ${v}`).join(', ');
          } else {
            parsedFabStr = '-';
          }
        }
      } catch (e) { }
      const fabricante = parsedFabStr;

      const existing = acc.find((x: any) =>
        x.codigo === p.codigo &&
        x.status === statusLabel &&
        x.item === item &&
        x.itemReap === itemReap &&
        x.avaliacao === avaliacao &&
        x.acao === acao &&
        x.descricao === descricao &&
        x.nfInterna === nf &&
        x.referencia === referencia &&
        x.fabricante === fabricante &&
        x.dataKit === dataKit
      );

      const qty = Number(p.quantidadeRecebida || p.quantidade || 0);

      if (existing) {
        existing.qtde += qty;
      } else {
        acc.push({
          codigo: p.codigo,
          descricao: descricao,
          nfInterna: nf,
          referencia: referencia,
          fabricante: fabricante,
          dataKit: dataKit,
          qtde: qty,
          status: statusLabel,
          item: item,
          itemReap: itemReap,
          avaliacao: avaliacao,
          acao: acao
        });
      }
      return acc;
    }, []) || [];

  const totalAprovadas = dynamicData.produtos?.filter((p: any) => p.recebido && p.status === 'procedente').reduce((acc: number, p: any) => acc + Number(p.quantidadeRecebida || p.quantidade || 0), 0) || 0;
  const totalReprovadas = dynamicData.produtos?.filter((p: any) => p.recebido && p.status === 'nao-procedente').reduce((acc: number, p: any) => acc + Number(p.quantidadeRecebida || p.quantidade || 0), 0) || 0;
  const totalCortesia = dynamicData.produtos?.filter((p: any) => p.recebido && p.acao === 'Cortesia').reduce((acc: number, p: any) => acc + Number(p.quantidadeRecebida || p.quantidade || 0), 0) || 0;

  const handlePrint = (elementId: string) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const printWin = window.open("", "_blank", "width=900,height=700");
    if (!printWin) return;
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Laudo</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; background: #fff; }
            .grid { display: grid; }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .grid-cols-5 { grid-template-columns: repeat(5, 1fr); }
            .grid-cols-10 { grid-template-columns: repeat(10, 1fr); }
            .grid-cols-12 { grid-template-columns: repeat(12, 1fr); }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .border-2 { border: 2px solid #111827; }
            .border { border: 1px solid #111827; }
            .border-b-2 { border-bottom: 2px solid #111827; }
            .border-b { border-bottom: 1px solid #111827; }
            .border-r-2 { border-right: 2px solid #111827; }
            .border-r { border-right: 1px solid #111827; }
            .border-t-2 { border-top: 2px solid #111827; }
            .border-t { border-top: 1px solid #111827; }
            .p-1 { padding: 4px; }
            .p-2 { padding: 8px; }
            .p-3 { padding: 12px; }
            .p-8 { padding: 32px; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-medium { font-weight: 500; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            .text-blue-900 { color: #1e3a8a; }
            .text-red-600 { color: #dc2626; }
            .text-blue-700 { color: #1d4ed8; }
            .text-green-600 { color: #16a34a; }
            .bg-gray-50 { background: #f9fafb; }
            .bg-gray-100 { background: #f3f4f6; }
            .col-span-2 { grid-column: span 2; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .justify-center { justify-content: center; }
            .justify-between { justify-content: space-between; }
            .leading-tight { line-height: 1.25; }
            .px-1, .px-2, .px-4 { padding-left: 4px; padding-right: 4px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-8 { margin-top: 32px; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .w-48 { width: 12rem; }
            .w-32 { width: 8rem; }
            .h-12 { height: 3rem; }
            .gap-4 { gap: 16px; }
            .px-4 { padding-left: 16px; padding-right: 16px; }

            /* Definindo classes de folha de estilo para classes Tailwind arbitrárias */
            .text-\\[9px\\] { font-size: 9px; }
            .text-\\[8px\\] { font-size: 8px; }
            .text-\\[10px\\] { font-size: 10px; }
            .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
            .text-2xl { font-size: 1.5rem; line-height: 2rem; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-xs { font-size: 0.75rem; line-height: 1rem; }
            .min-h-\\[35px\\] { min-height: 35px; }
            .bg-white { background-color: #ffffff; }
            .text-blue-900 { color: rgb(30 58 138); }
            
            .grid { display: grid; }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .grid-cols-5 { grid-template-columns: repeat(5, 1fr); }
            .grid-cols-12 { grid-template-columns: repeat(12, 1fr); }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .border-2 { border: 2px solid #111827; }
            .border { border: 1px solid #111827; }
            .border-b-2 { border-bottom: 2px solid #111827; }
            .border-b { border-bottom: 1px solid #111827; }
            .border-r-2 { border-right: 2px solid #111827; }
            .border-r { border-right: 1px solid #111827; }
            .border-t-2 { border-top: 2px solid #111827; }
            .border-t { border-top: 1px solid #111827; }
            .p-1 { padding: 4px; }
            .p-2 { padding: 8px; }
            .p-3 { padding: 12px; }
            .p-4 { padding: 16px; }
            .p-8 { padding: 32px; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            .font-medium { font-weight: 500; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            .bg-gray-50 { background: #f9fafb; }
            .bg-gray-100 { background: #f3f4f6; }
            .col-span-2 { grid-column: span 2; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .items-start { align-items: flex-start; }
            .justify-center { justify-content: center; }
            .justify-between { justify-content: space-between; }
            .leading-tight { line-height: 1.25; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mt-8 { margin-top: 32px; }
            .mx-auto { margin-left: auto; margin-right: auto; }
            .w-48 { width: 12rem; }
            .w-32 { width: 8rem; }
            .h-12 { height: 3rem; }
            .gap-4 { gap: 16px; }
            .whitespace-nowrap { white-space: nowrap; }
            .text-green-600 { color: #16a34a; }
            .text-red-600 { color: #dc2626; }
            .text-blue-700 { color: #1d4ed8; }
            @media print {
              @page { size: A4 landscape; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              select, input, .print\\:hidden { display: none !important; }
            }
          </style>
        </head>
        <body>${el.outerHTML}</body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 400);
  };

  const handleExportPDF = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `laudo-${dynamicData.nfGarantia || 'comkit'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
    };

    html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="w-full space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 print:hidden">
        <button
          onClick={() => setActiveTab("cliente")}
          className={`flex items-center gap-2 px-6 py-3 text-lg font-medium transition-colors border-b-2 ${activeTab === "cliente"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
          <FileText size={24} />
          Visualização Laudo Cliente
        </button>
        <button
          onClick={() => setActiveTab("interna")}
          className={`flex items-center gap-2 px-6 py-3 text-lg font-medium transition-colors border-b-2 ${activeTab === "interna"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
          <Lock size={24} />
          Visualização Laudo Interna
        </button>
      </div>

      {/* Botões de ação - não aparecem na impressão */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
          <span className="text-gray-700">Voltar</span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => handlePrint(activeTab === 'cliente' ? 'print-laudo-cliente' : 'print-laudo-interna')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer size={18} />
            Imprimir
          </button>
          <button 
            onClick={() => handleExportPDF(activeTab === 'cliente' ? 'print-laudo-cliente' : 'print-laudo-interna')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={18} />
            Exportar PDF
          </button>
        </div>
      </div>

      {activeTab === "cliente" ? (
        <div id="print-laudo-cliente" className="bg-white p-8 shadow-lg border-2 border-gray-900 max-w-full print:max-w-full mx-auto">
          <div className="border-2 border-gray-900 mb-0">
            <div className="grid grid-cols-3 border-b-2 border-gray-900">
              <div className="border-r-2 border-gray-900 p-3 flex items-center justify-center">
                <div className="text-2xl font-bold text-blue-900">COMKIT</div>
              </div>
              <div className="border-r-2 border-gray-900 p-3 flex items-center justify-center">
                <h1 className="text-sm font-bold text-center">RELATÓRIO DE ANÁLISE DE GARANTIA</h1>
              </div>
              <div className="p-3">
                <div className="text-xs font-bold mb-1 uppercase">DATA</div>
                <div className="text-sm">
                  {new Date(dynamicData.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 border-b-2 border-gray-900 text-sm">
              <div className="border-r-2 border-gray-900 p-2"><div className="font-bold">CLIENTE:</div></div>
              <div className="border-r-2 border-gray-900 p-2 text-center col-span-2"><div>{dynamicData.cliente}</div></div>
              <div className="border-r-2 border-gray-900 p-2"><div className="font-bold">NOTA Nº</div></div>
              <div className="p-2 text-center"><div>{dynamicData.nfGarantia}</div></div>
            </div>

            {dynamicData.nfInterna && (
              <div className="border-b-2 border-gray-900 p-2 text-xs">
                <span className="font-bold uppercase">NF Internas: </span>
                <span>{dynamicData.nfInterna}</span>
              </div>
            )}

            <div className="grid border-b-2 border-gray-900 bg-gray-50 uppercase" style={{ gridTemplateColumns: '15% 15% 5% 15% 35% 15%' }}>
              <div className="border-r-2 border-gray-900 p-2 text-center"><div className="text-[10px] font-bold">PRODUTO</div></div>
              <div className="border-r-2 border-gray-900 p-2 text-center"><div className="text-[10px] font-bold">REFERÊNCIA</div></div>
              <div className="border-r-2 border-gray-900 p-2 text-center"><div className="text-[10px] font-bold">QTD</div></div>
              <div className="border-r-2 border-gray-900 p-2 text-center"><div className="text-[10px] font-bold">STATUS</div></div>
              <div className="border-r-2 border-gray-900 p-2 text-center"><div className="text-[10px] font-bold">ANÁLISE</div></div>
              <div className="p-2 text-center"><div className="text-[10px] font-bold">RESOLUÇÃO</div></div>
            </div>

            {groupedProdutosCliente.map((p: any, index: number) => (
              <div key={index} className={`grid ${index < groupedProdutosCliente.length - 1 ? "border-b border-gray-900" : ""} text-[10px] min-h-[40px]`} style={{ gridTemplateColumns: '15% 15% 5% 15% 35% 15%' }}>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center font-bold">{p.codigo}</div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center italic">{p.referencia}</div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center">{p.qtde}</div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center whitespace-nowrap font-bold">
                  <span className={p.status === 'PROCEDENTE' ? 'text-green-600' : p.status === 'NÃO PROCEDENTE' ? 'text-red-600' : ''}>
                    {p.status}
                  </span>
                </div>
                <div className="border-r-2 border-gray-900 p-1 flex items-start pl-2 italic leading-tight"><div>{p.avaliacao}</div></div>
                <div className="p-1 text-center font-bold flex items-center justify-center uppercase">{p.acao}</div>
              </div>
            ))}

            <div className="border-t-2 border-gray-900 p-3 text-xs">
              <div className="mb-2"><strong>TOTAL DE PEÇAS EM GARANTIA APROVADAS:</strong> {totalAprovadas}</div>
              <div className="mb-2 ml-16">ATENDIDAS: {totalAprovadas}</div>
              <div><strong>TOTAL DE PEÇAS EM GARANTIA REPROVADAS:</strong> {totalReprovadas}</div>
            </div>
          </div>

          <div className="border-2 border-t-0 border-gray-900 mt-0 text-sm">
            <div className="grid grid-cols-2 border-b border-gray-900 text-xs text-center">
              <div className="border-r border-gray-900 p-3">
                <div className="mb-2 font-bold uppercase">Pagamento:</div>
                <div className="flex gap-4 justify-center">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <span>({dynamicData.pagamento === "garantia" ? "X" : " "})</span>
                    <span>Garantia</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <span>({dynamicData.pagamento === "bonificacao" ? "X" : " "})</span>
                    <span>Bonificação</span>
                  </label>
                </div>
              </div>
              <div className="p-3">
                <div className="font-bold uppercase mb-4">Cliente:</div>
                <div className="text-xs mb-1">{dynamicData.cliente}</div>
                <div className="border-t border-gray-400 w-32 mx-auto"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-gray-900 text-xs h-12">
              <div className="border-r border-gray-900 p-2">
                <div className="font-bold uppercase">Data:</div>
                <div className="text-[10px] mt-1">
                  {new Date(dynamicData.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="p-2">
                <div className="font-bold uppercase mb-4 text-center">Validado por:</div>
                <div className="border-t border-gray-400 w-32 mx-auto"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 text-xs h-12">
              <div className="border-r border-gray-900 p-2">
                <div className="font-bold uppercase">Doc: {dynamicData.nfGarantia}</div>
              </div>
              <div className="p-2">
                <div className="font-bold uppercase mb-4 text-center">Autorizado por:</div>
                <div className="border-t border-gray-400 w-32 mx-auto"></div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px]">
            <div className="border-t border-gray-400 w-48 mx-auto mb-1"></div>
            <div className="font-bold uppercase">{dynamicData.responsavel || profile?.nome || "Responsável"}</div>
            <div>{reportSettings.department}</div>
            <div>{reportSettings.company_name}</div>
            <div>Tel{reportSettings.phone}</div>
          </div>
        </div>
      ) : (
        <div id="print-laudo-interna" className="bg-white p-8 shadow-lg border-2 border-gray-900 max-w-full print:max-w-full mx-auto">
          <div className="border-2 border-gray-900 mb-0">
            <div className="grid grid-cols-3 border-b-2 border-gray-900">
              <div className="border-r-2 border-gray-900 p-3 flex items-center justify-center text-center">
                <div>
                  <div className="text-xl font-bold text-blue-900">COMKIT</div>
                </div>
              </div>
              <div className="border-r-2 border-gray-900 p-3 flex items-center justify-center">
                <h1 className="text-sm font-bold text-center">LAUDO FINAL DE GARANTIA (INTERNO)</h1>
              </div>
              <div className="p-3">
                <div className="text-sm">
                  {new Date(dynamicData.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 border-b-2 border-gray-900 text-sm">
              <div className="border-r-2 border-gray-900 p-2"><div className="font-bold">CLIENTE:</div></div>
              <div className="border-r-2 border-gray-900 p-2 text-center col-span-2"><div>{dynamicData.cliente}</div></div>
              <div className="border-r-2 border-gray-900 p-2"><div className="font-bold">NOTA Nº</div></div>
              <div className="p-2 text-center"><div>{dynamicData.nfGarantia}</div></div>
            </div>

            <div className="grid border-b-2 border-gray-900 bg-gray-100 uppercase" style={{ gridTemplateColumns: '8% 16% 8% 12% 9% 7% 5% 7% 10% 9% 9%' }}>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px] flex items-center justify-center">CÓDIGO</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px] flex items-center justify-center">DESCRIÇÃO</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px] flex items-center justify-center">REFERÊNCIA</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[8px] leading-tight flex items-center justify-center">ITEM COM DEFEITO</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px] flex items-center justify-center">FABRICANTE</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px] flex items-center justify-center">DATA KIT</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px] flex items-center justify-center">QTD</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px] flex items-center justify-center">NF</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[8px] leading-tight flex items-center justify-center">ITEM REAPROVEITADO</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px] flex items-center justify-center">STATUS</div>
              <div className="p-1 text-center font-bold text-[9px] flex items-center justify-center">RESOLUÇÃO</div>
            </div>

            {groupedProdutosInterna.map((p: any, index: number) => (
              <div key={index} className={`grid ${index < groupedProdutosInterna.length - 1 ? "border-b border-gray-900" : ""} text-[9px] min-h-[35px]`} style={{ gridTemplateColumns: '8% 16% 8% 12% 9% 7% 5% 7% 10% 9% 9%' }}>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center font-bold bg-white">{p.codigo}</div>
                <div className="border-r-2 border-gray-900 p-1 flex items-center px-1 leading-tight bg-white">{p.descricao}</div>
                <div className="border-r-2 border-gray-900 p-1 flex items-center justify-center bg-white">
                  <span className="text-[9px] text-center">{p.referencia === '-' ? '' : p.referencia}</span>
                </div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center font-medium bg-white leading-tight">
                  <span className="text-[8px] text-red-600 font-bold">{p.item === '-' ? '' : p.item}</span>
                </div>
                <div className="border-r-2 border-gray-900 p-1 flex items-center justify-center bg-white">
                  <span className="text-[9px] text-center">{p.fabricante === '-' ? '' : p.fabricante}</span>
                </div>
                <div className="border-r-2 border-gray-900 p-1 flex items-center justify-center bg-white">
                  <span className="text-[9px] text-center">{p.dataKit === '-' ? '' : p.dataKit}</span>
                </div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center bg-white">{p.qtde}</div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center italic text-blue-700 bg-white">{p.nfInterna}</div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center font-medium bg-white leading-tight">
                  <span className="text-[8px] text-green-600 font-bold">{p.itemReap === '-' ? '' : p.itemReap}</span>
                </div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center font-bold bg-white">
                  <span className={p.status === 'PROCEDENTE' ? 'text-green-600' : p.status === 'NÃO PROCEDENTE' ? 'text-red-600' : ''}>
                    {p.status}
                  </span>
                </div>
                <div className="p-1 text-center flex items-center justify-center font-bold uppercase bg-white">{p.acao}</div>
              </div>
            ))}

            <div className="border-t-2 border-gray-900 p-2 text-[10px] bg-gray-50">
              <div className="flex justify-between px-4">
                <span>APROVADAS: <strong>{totalAprovadas}</strong></span>
                <span>REPROVADAS: <strong>{totalReprovadas}</strong></span>
                <span>CORTESIA: <strong>{totalCortesia}</strong></span>
                <span>TOTAL GERAL: <strong>{Number(totalAprovadas) + Number(totalReprovadas) + Number(totalCortesia)}</strong></span>
              </div>
            </div>
          </div>

          <div className="border-2 border-t-0 border-gray-900 mt-0 text-sm">
            <div className="grid grid-cols-2 border-b border-gray-900 text-xs text-center">
              <div className="border-r border-gray-900 p-3">
                <div className="mb-2 font-bold uppercase">Pagamento:</div>
                <div className="flex gap-4 justify-center">
                  <span className="flex items-center gap-1">
                    <span>({dynamicData.pagamento === "garantia" ? "X" : " "})</span> Garantia
                  </span>
                  <span className="flex items-center gap-1">
                    <span>({dynamicData.pagamento === "bonificacao" ? "X" : " "})</span> Bonificação
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="font-bold uppercase mb-4">Cliente:</div>
                <div className="text-xs mb-1">{dynamicData.cliente}</div>
                <div className="border-t border-gray-400 w-32 mx-auto"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-gray-900 text-xs h-12 text-left">
              <div className="border-r border-gray-900 p-2">
                <div className="font-bold uppercase">Data:</div>
                <div className="text-[10px] mt-1">
                  {new Date(dynamicData.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                </div>
              </div>
              <div className="p-2">
                <div className="font-bold uppercase mb-4 text-center">Validado por:</div>
                <div className="border-t border-gray-400 w-32 mx-auto"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 text-xs h-12 text-left">
              <div className="border-r border-gray-900 p-2">
                <div className="font-bold uppercase">Doc: {dynamicData.nfGarantia}</div>
              </div>
              <div className="p-2">
                <div className="font-bold uppercase mb-4 text-center">Autorizado por:</div>
                <div className="border-t border-gray-400 w-32 mx-auto"></div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px]">
            <div className="border-t border-gray-400 w-48 mx-auto mb-1"></div>
            <div className="font-bold uppercase">{dynamicData.responsavel || profile?.nome || "Responsável"}</div>
            <div>{reportSettings.department}</div>
            <div>{reportSettings.company_name}</div>
            <div>Tel{reportSettings.phone}</div>
          </div>
        </div>
      )}
    </div>
  );
}
