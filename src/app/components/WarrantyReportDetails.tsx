import { ArrowLeft, Printer, Download, Lock, FileText, Loader2 } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { useLaudos } from "../contexts/LaudosContext";

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

  const groupedProdutosCliente = dynamicData.produtos?.reduce((acc: any[], p: any) => {
    let statusLabel = '-';
    if (!p.recebido) {
      statusLabel = 'NÃO RECEBIDO';
    } else {
      statusLabel = p.status === 'procedente' ? 'PROCEDENTE' : (p.status === 'nao-procedente' ? 'NÃO PROC.' : '-');
    }
    const item = p.itemAvaliado || '-';
    const itemReap = p.itemReaproveitado || '-';
    const avaliacao = p.avaliacaoItem || '-';
    const acao = p.acao || '-';

    const existing = acc.find((x: any) =>
      x.codigo === p.codigo &&
      x.status === statusLabel &&
      x.item === item &&
      x.avaliacao === avaliacao &&
      x.acao === acao
    );

    const qty = Number(p.quantidadeRecebida || p.quantidade || 1);

    if (existing) {
      existing.qtde += qty;
    } else {
      acc.push({
        codigo: p.codigo,
        descricao: p.descricao,
        qtde: qty,
        status: statusLabel,
        item: item,
        avaliacao: avaliacao,
        acao: acao,
      });
    }
    return acc;
  }, []) || [];

  const groupedProdutosInterna = dynamicData.produtos?.reduce((acc: any[], p: any) => {
    let statusLabel = '-';
    if (!p.recebido) {
      statusLabel = 'NÃO RECEBIDO';
    } else {
      statusLabel = p.status === 'procedente' ? 'PROCEDENTE' : (p.status === 'nao-procedente' ? 'NÃO PROC.' : '-');
    }

    const item = p.itemAvaliado || '-';
    const itemReap = p.itemReaproveitado || '-';
    const avaliacao = p.avaliacaoItem || '-';
    const acao = p.acao || '-';
    const descricao = p.descricao || '-';
    const nf = p.nfInterna || '-';
    const referencia = p.referencia || '-';
    const fabricante = p.fabricante || '-';
    const dataKit = p.dataKit || '-';

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

    const qty = Number(p.quantidadeRecebida || p.quantidade || 1);

    if (existing) {
      existing.qtde += qty;
    } else {
      acc.push({
        codigo: p.codigo,
        descricao: p.descricao,
        qtde: qty,
        status: statusLabel,
        item: item,
        itemReap: itemReap,
        avaliacao: avaliacao,
        acao: acao,
        nfInterna: nf,
        referencia: referencia,
        fabricante: fabricante,
        dataKit: dataKit
      });
    }
    return acc;
  }, []) || [];

  const totalAprovadas = dynamicData.produtos?.filter((p: any) => p.recebido).reduce((acc: number, p: any) => p.status === 'procedente' ? acc + Number(p.quantidadeRecebida || p.quantidade || 1) : acc, 0) || 0;
  const totalReprovadas = dynamicData.produtos?.filter((p: any) => p.recebido).reduce((acc: number, p: any) => p.status === 'nao-procedente' ? acc + Number(p.quantidadeRecebida || p.quantidade || 1) : acc, 0) || 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 print:hidden">
        <button
          onClick={() => setActiveTab("cliente")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "cliente"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
          <FileText size={18} />
          Visualização Laudo Cliente
        </button>
        <button
          onClick={() => setActiveTab("interna")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "interna"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
          <Lock size={18} />
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
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer size={18} />
            Imprimir
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={18} />
            Exportar PDF
          </button>
        </div>
      </div>

      {activeTab === "cliente" ? (
        /* Laudo Cliente - formato de documento */
        <div className="bg-white p-8 shadow-lg border-2 border-gray-900 max-w-5xl mx-auto">
          {/* Cabeçalho */}
          <div className="border-2 border-gray-900 mb-0">
            <div className="grid grid-cols-3 border-b-2 border-gray-900">
              <div className="border-r-2 border-gray-900 p-3 flex items-center justify-center">
                <div className="text-2xl font-bold text-blue-900">COMKIT</div>
              </div>
              <div className="border-r-2 border-gray-900 p-3 flex items-center justify-center">
                <h1 className="text-sm font-bold text-center">
                  RELATÓRIO DE ANÁLISE DE GARANTIA
                </h1>
              </div>
              <div className="p-3">
                <div className="text-xs font-bold mb-1">DATA</div>
                <div className="text-sm">{dataFormatada}</div>
              </div>
            </div>

            {/* Linha de informações principais */}
            <div className="grid grid-cols-5 border-b-2 border-gray-900 text-sm">
              <div className="border-r-2 border-gray-900 p-2">
                <div className="font-bold">CLIENTE:</div>
              </div>
              <div className="border-r-2 border-gray-900 p-2 text-center col-span-2">
                <div>{dynamicData.cliente}</div>
              </div>
              <div className="border-r-2 border-gray-900 p-2">
                <div className="font-bold">NOTA Nº</div>
              </div>
              <div className="p-2 text-center">
                <div>{dynamicData.nfGarantia}</div>
              </div>
            </div>

            {dynamicData.nfInterna && (
              <div className="border-b-2 border-gray-900 p-2 text-xs">
                <span className="font-bold">NF INTERNAS: </span>
                <span>{dynamicData.nfInterna}</span>
              </div>
            )}

            {/* Cabeçalho da tabela */}
            <div className="grid grid-cols-6 border-b-2 border-gray-900 bg-gray-50">
              <div className="border-r-2 border-gray-900 p-2 text-center">
                <div className="text-[10px] font-bold">PRODUTO</div>
              </div>
              <div className="border-r-2 border-gray-900 p-2 text-center">
                <div className="text-[10px] font-bold">QTD</div>
              </div>
              <div className="border-r-2 border-gray-900 p-2 text-center">
                <div className="text-[10px] font-bold">STATUS</div>
              </div>
              <div className="border-r-2 border-gray-900 p-2 text-center">
                <div className="text-[10px] font-bold">ITEM AVALIADO</div>
              </div>
              <div className="border-r-2 border-gray-900 p-2 text-center">
                <div className="text-[10px] font-bold">AVALIAÇÃO</div>
              </div>
              <div className="p-2 text-center">
                <div className="text-[10px] font-bold">AÇÃO</div>
              </div>
            </div>

            {/* Linhas de produtos */}
            {groupedProdutosCliente.map((produto: any, index: number) => (
              <div
                key={index}
                className={`grid grid-cols-6 ${index < groupedProdutosCliente.length - 1
                  ? "border-b border-gray-900"
                  : ""
                  } text-[10px] min-h-[40px]`}
              >
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center font-bold">
                  {produto.codigo}
                </div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center">
                  {produto.qtde}
                </div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center whitespace-nowrap">
                  {produto.status}
                </div>
                <div className="border-r-2 border-gray-900 p-1 flex flex-col items-start pl-2 italic leading-tight">
                  <div className="flex flex-col">
                    <span>{produto.item}</span>
                  </div>
                </div>
                <div className="border-r-2 border-gray-900 p-1 flex items-center pl-2">
                  {produto.avaliacao}
                </div>
                <div className="p-1 text-center font-bold flex items-center justify-center uppercase">
                  {produto.acao}
                </div>
              </div>
            ))}

            {/* Totais */}
            <div className="border-t-2 border-gray-900 p-3 text-xs">
              <div className="mb-2">
                <strong>TOTAL DE PEÇAS EM GARANTIA APROVADAS:</strong>{" "}
                {totalAprovadas}
              </div>
              <div className="mb-2 ml-16">
                ATENDIDAS: {totalAprovadas} // AGUARDANDO
                REPOSIÇÃO: 0
              </div>
              <div>
                <strong>TOTAL DE PEÇAS EM GARANTIA REPROVADAS:</strong>{" "}
                {totalReprovadas}
              </div>
            </div>
          </div>

          {/* Seção de assinaturas */}
          <div className="border-2 border-t-0 border-gray-900 mt-0 text-sm">
            <div className="grid grid-cols-2 border-b border-gray-900 text-xs">
              <div className="border-r border-gray-900 p-3">
                <div className="mb-2">
                  <strong>PAGAMENTO:</strong>
                </div>
                <div className="flex gap-4 ml-4">
                  <label className="flex items-center gap-1">
                    <span>({dynamicData.pagamento === "garantia" ? "X" : " "})</span> Garantia
                  </label>
                  <label className="flex items-center gap-1">
                    <span>({dynamicData.pagamento === "bonificacao" ? "X" : " "})</span> Bonificação
                  </label>
                </div>
              </div>
              <div className="p-3">
                <strong>CLIENTE:</strong> {dynamicData.cliente}
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-gray-900 text-xs text-left">
              <div className="border-r border-gray-900 p-3">
                <strong>DATA:</strong> {dataFormatada}
              </div>
              <div className="p-3">
                <strong>VALIDADO POR:</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 text-xs">
              <div className="border-r border-gray-900 p-3 text-left">
                <strong>DOC:</strong> {dynamicData.nfGarantia}
              </div>
              <div className="p-3">
                <strong>AUTORIZADO POR:</strong>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="mt-8 text-center text-xs">
            <div className="border-t border-gray-400 w-64 mx-auto mb-2"></div>
            <div className="font-bold">{dynamicData.responsavel || profile?.nome || "Responsável"}</div>
            <div className="mt-1">Departamento de Qualidade e Garantia</div>
            <div>Automotriz Indústria e Comércio de Peças Automotivas</div>
            <div>Tel(21) 96480-3390</div>
          </div>
        </div>
      ) : (
        /* Laudo Interno - formato de documento */
        <div className="bg-white p-8 shadow-lg border-2 border-gray-900 max-w-5xl mx-auto">
          <div className="border-2 border-gray-900 mb-0">
            <div className="grid grid-cols-3 border-b-2 border-gray-900">
              <div className="border-r-2 border-gray-900 p-3 flex items-center justify-center text-center">
                <div>
                  <div className="text-xl font-bold text-blue-900">COMKIT</div>
                  <div className="text-[8px] uppercase">Controle Interno</div>
                </div>
              </div>
              <div className="border-r-2 border-gray-900 p-3 flex items-center justify-center">
                <h1 className="text-sm font-bold text-center">LAUDO FINAL DE GARANTIA (INTERNO)</h1>
              </div>
              <div className="p-3">
                <div className="text-xs font-bold mb-1 uppercase text-red-600 italic">INTERNO</div>
                <div className="text-sm">{dataFormatada}</div>
              </div>
            </div>

            <div className="grid grid-cols-5 border-b-2 border-gray-900 text-sm">
              <div className="border-r-2 border-gray-900 p-2"><div className="font-bold">CLIENTE:</div></div>
              <div className="border-r-2 border-gray-900 p-2 text-center col-span-2"><div>{dynamicData.cliente}</div></div>
              <div className="border-r-2 border-gray-900 p-2"><div className="font-bold">NOTA Nº</div></div>
              <div className="p-2 text-center"><div>{dynamicData.nfGarantia}</div></div>
            </div>

            <div className="grid grid-cols-10 border-b-2 border-gray-900 bg-gray-100 uppercase">
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px]">CÓDIGO</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px] col-span-2">DESCRIÇÃO</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px]">REFERÊNCIA</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px]">FABRICANTE</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px]">DATA KIT</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px]">QTD</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px]">NF</div>
              <div className="border-r-2 border-gray-900 p-1 text-center font-bold text-[9px]">STATUS</div>
              <div className="p-1 text-center font-bold text-[9px]">AÇÃO</div>
            </div>

            {groupedProdutosInterna.map((p: any, index: number) => (
              <div key={index} className={`grid grid-cols-10 ${index < groupedProdutosInterna.length - 1 ? "border-b border-gray-900" : ""} text-[9px] min-h-[35px]`}>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center font-bold bg-white">{p.codigo}</div>
                <div className="border-r-2 border-gray-900 p-1 flex items-center px-1 col-span-2 leading-tight bg-white">{p.descricao}</div>
                <div className="border-r-2 border-gray-900 p-1 flex items-center justify-center bg-white text-center">
                  {p.referencia === '-' ? '' : p.referencia}
                </div>
                <div className="border-r-2 border-gray-900 p-1 flex items-center justify-center bg-white text-center">
                  {p.fabricante === '-' ? '' : p.fabricante}
                </div>
                <div className="border-r-2 border-gray-900 p-1 flex items-center justify-center bg-white text-center">
                  {p.dataKit === '-' ? '' : p.dataKit}
                </div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center bg-white">{p.qtde}</div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center italic text-blue-700 bg-white">{p.nfInterna}</div>
                <div className="border-r-2 border-gray-900 p-1 text-center flex flex-col items-center justify-center font-medium bg-white">
                  <div>{p.status}</div>
                  {p.itemReap !== '-' && <div className="text-[7px] text-green-600 font-bold">REAP: {p.itemReap}</div>}
                </div>
                <div className="p-1 text-center flex items-center justify-center font-bold uppercase bg-white">{p.acao}</div>
              </div>
            ))}

            <div className="border-t-2 border-gray-900 p-2 text-[10px] bg-gray-50">
              <div className="flex justify-between px-4">
                <span>APROVADAS: <strong>{totalAprovadas}</strong></span>
                <span>REPROVADAS: <strong>{totalReprovadas}</strong></span>
                <span>TOTAL GERAL: <strong>{Number(totalAprovadas) + Number(totalReprovadas)}</strong></span>
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
              <div className="p-3">
                <div className="font-bold uppercase mb-4">Cliente:</div>
                <div className="text-xs mb-1">{dynamicData.cliente}</div>
                <div className="border-t border-gray-400 w-32 mx-auto"></div>
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-gray-900 text-xs h-12 text-left">
              <div className="border-r border-gray-900 p-2">
                <div className="font-bold uppercase">Data: {dataFormatada}</div>
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
            <div>Departamento de Qualidade e Garantia</div>
            <div>Automotriz Indústria e Comércio de Peças Automotivas</div>
            <div>Tel(21) 96480-3390</div>
          </div>
        </div>
      )}
    </div>
  );
}
