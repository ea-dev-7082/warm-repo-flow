import { ArrowLeft, Printer, Download } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Mock data para demonstração
const mockWarrantyData = {
  id: "02/2026",
  cliente: "Distribuidora ABC Ltda",
  data: "04 MARÇO",
  notaNumero: "302.543",
  nfInternas: "",
  produtos: [
    {
      codigo: "91.463",
      qtdeInformada: "06",
      qtdeRecebida: "06",
      analise: "02: Garantia não Procedente - Batente desgastado (2023). Kit parcial não está na garantia.",
      observacao: "06: CONTESIA",
    },
    {
      codigo: "92.534",
      qtdeInformada: "02",
      qtdeRecebida: "02",
      analise: "02: Garantia não Procedente - Ruído no rolamento.",
      observacao: "02: TROCA",
    },
    {
      codigo: "93.375",
      qtdeInformada: "02",
      qtdeRecebida: "02",
      analise: "01: Garantia não Procedente - Batente desgastado. Kit pnl",
      observacao: "01: CONTESIA",
    },
    {
      codigo: "94.130",
      qtdeInformada: "01",
      qtdeRecebida: "01",
      analise: "01: Garantia procedente - rompimento no coifar.",
      observacao: "03: TROCA",
    },
    {
      codigo: "94.693",
      qtdeInformada: "01",
      qtdeRecebida: "01",
      analise: "01: Garantia não Procedente - Batente desgastado (2021). Kit parcial não está na garantia.",
      observacao: "01: TROCA",
    },
    {
      codigo: "95.8058",
      qtdeInformada: "01",
      qtdeRecebida: "01",
      analise: "01: Garantia não procedente - coifar e rolamento não pertencerão aos nossos fornecedores.",
      observacao: "01: DEVOLUÇÃO",
    },
  ],
  totalAprovadas: "06",
  totalReprovadas: "01",
  atenciosamente: "01",
  aguardandoReposicao: "00",
  responsavel: "Rodolfo Costa",
  departamento: "Departamento de Qualidade e Garantia",
  empresa: "Automotriz Indústria e Comércio de Peças Automotivas",
  telefone: "Tel(21) 96480-3390",
};

export function WarrantyReportDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const dynamicData = location.state;

  // Se houver dados dinâmicos, usamos eles; caso contrário, mock
  const data = dynamicData ? {
    id: dynamicData.id || "NOVO",
    cliente: dynamicData.cliente,
    data: new Date(dynamicData.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase(),
    notaNumero: dynamicData.nfGarantia,
    nfInternas: dynamicData.nfInterna,
    produtos: dynamicData.produtos?.reduce((acc: any[], p: any) => {
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
        x.itemReap === itemReap &&
        x.avaliacao === avaliacao &&
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
          itemReap: itemReap,
          avaliacao: avaliacao,
          acao: acao
        });
      }
      return acc;
    }, []) || [],
    totalAprovadas: dynamicData.produtos?.filter((p: any) => p.recebido).reduce((acc: number, p: any) => p.status === 'procedente' ? acc + Number(p.quantidadeRecebida || p.quantidade || 0) : acc, 0).toString() || "0",
    totalReprovadas: dynamicData.produtos?.filter((p: any) => p.recebido).reduce((acc: number, p: any) => p.status === 'nao-procedente' ? acc + Number(p.quantidadeRecebida || p.quantidade || 0) : acc, 0).toString() || "0",
    atenciosamente: "1",
    aguardandoReposicao: "0",
    responsavel: "Rodolfo Costa",
    departamento: "Departamento de Qualidade e Garantia",
    empresa: "Automotriz Indústria e Comércio de Peças Automotivas",
    telefone: "Tel(21) 96480-3390",
  } : mockWarrantyData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
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

      {/* Laudo - formato de documento */}
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
              <div className="text-sm">
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Linha de informações principais */}
          <div className="grid grid-cols-5 border-b-2 border-gray-900 text-sm">
            <div className="border-r-2 border-gray-900 p-2">
              <div className="font-bold">CLIENTE:</div>
            </div>
            <div className="border-r-2 border-gray-900 p-2 text-center col-span-2">
              <div>{data.cliente}</div>
            </div>
            <div className="border-r-2 border-gray-900 p-2">
              <div className="font-bold">NOTA Nº</div>
            </div>
            <div className="p-2 text-center">
              <div>{data.notaNumero}</div>
            </div>
          </div>

          {data.nfInternas && (
            <div className="border-b-2 border-gray-900 p-2 text-xs">
              <span className="font-bold">NF INTERNAS: </span>
              <span>{data.nfInternas}</span>
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
          {data.produtos.map((produto: any, index: number) => (
            <div
              key={index}
              className={`grid grid-cols-6 ${index < data.produtos.length - 1
                ? "border-b border-gray-900"
                : ""
                } text-[10px]`}
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
                <div>{produto.item}</div>
                {produto.itemReap !== '-' && <div className="text-[9px] text-green-700 font-bold">REAPR: {produto.itemReap}</div>}
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
              {data.totalAprovadas}
            </div>
            <div className="mb-2 ml-16">
              ATENDIDAS: {data.atenciosamente} // AGUARDANDO
              REPOSIÇÃO: {data.aguardandoReposicao}
            </div>
            <div>
              <strong>TOTAL DE PEÇAS EM GARANTIA REPROVADAS:</strong>{" "}
              {data.totalReprovadas}
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
                  <span>( )</span> Garantia
                </label>
                <label className="flex items-center gap-1">
                  <span>( )</span> Bonificação
                </label>
              </div>
            </div>
            <div className="p-3">
              <strong>CLIENTE:</strong> {data.cliente}
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-gray-900 text-xs">
            <div className="border-r border-gray-900 p-3">
              <strong>DATA:</strong> {data.data}
            </div>
            <div className="p-3">
              <strong>VALIDADO POR:</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 text-xs">
            <div className="border-r border-gray-900 p-3">
              <strong>DOC:</strong> {data.notaNumero}
            </div>
            <div className="p-3">
              <strong>AUTORIZADO POR:</strong>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-8 text-center text-xs">
          <div className="border-t border-gray-400 w-64 mx-auto mb-2"></div>
          <div className="font-bold">{data.responsavel}</div>
          <div className="mt-1">{data.departamento}</div>
          <div>{data.empresa}</div>
          <div>{data.telefone}</div>
        </div>
      </div>
    </div>
  );
}
