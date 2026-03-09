import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FileDown, Plus, Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { XMLParser } from "fast-xml-parser";
import { MultiSelect } from "./ui/MultiSelect";

const ITEM_OPTIONS = [
  "Coxim", "Batente", "Coifa", "Rolamento",
  "Mola", "Bandeja", "Pivô", "Terminal", "Bucha"
];

export function LaudoTecnico() {
  const location = useLocation();
  const navigate = useNavigate();
  const importedData = location.state;

  const [activeTab, setActiveTab] = useState<"analise" | "cliente" | "interna">("analise");
  const [formData, setFormData] = useState({
    cliente: importedData?.cliente || "",
    nfGarantia: importedData?.nfGarantia || "",
    nfInterna: importedData?.nfInterna || "",
    data: new Date().toISOString().split("T")[0],
    produtos: importedData?.produtos?.map((p: any) => ({
      ...p,
      recebido: false,
      status: "",
      itemAvaliado: "",
      avaliacaoItem: "",
      acao: "",
      referencia: "",
      fabricante: "",
      dataKit: "",
      itemReaproveitado: "",
    })) || [],
  });

  const [pagamento, setPagamento] = useState<"garantia" | "bonificacao" | null>(null);

  const [newItem, setNewItem] = useState({
    codigo: "",
    descricao: "",
    nfInterna: "",
    quantidade: "1"
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const xmlText = event.target?.result as string;
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_"
        });
        const jsonObj = parser.parse(xmlText);

        const infNFe = jsonObj?.nfeProc?.NFe?.infNFe || jsonObj?.NFe?.infNFe;
        if (!infNFe) {
          throw new Error("Formato XML não reconhecido");
        }

        const cliente = infNFe.emit?.xNome || formData.cliente;
        const nfGarantia = infNFe.ide?.nNF || formData.nfGarantia;

        let dets = infNFe.det;
        if (!Array.isArray(dets)) {
          dets = dets ? [dets] : [];
        }

        const nfInternas: string[] = [];
        const produtosMapeados: any[] = [];

        dets.forEach((det: any) => {
          const infAdProd = det.infAdProd || "";
          const nfMatch = infAdProd.match(/NF\.?\s*(\d+)/i);
          const qCom = Math.floor(parseFloat(det.prod?.qCom || "0"));
          const nf = nfMatch ? nfMatch[1] : "";

          if (nf && !nfInternas.includes(nf)) nfInternas.push(nf);

          for (let i = 0; i < qCom; i++) {
            produtosMapeados.push({
              codigo: det.prod?.cProd || "N/A",
              descricao: det.prod?.xProd || "N/A",
              quantidade: "1",
              nfInterna: nf,
              recebido: false,
              status: "",
              itemAvaliado: "",
              avaliacaoItem: "",
              acao: "",
              referencia: "",
              fabricante: "",
              dataKit: "",
              itemReaproveitado: ""
            });
          }
        });

        const nfInternaFormatada = nfInternas.length > 0 ? nfInternas.join(";") + ";" : formData.nfInterna;

        setFormData({
          ...formData,
          cliente,
          nfGarantia: nfGarantia.toString(),
          nfInterna: nfInternaFormatada,
          produtos: [...formData.produtos, ...produtosMapeados]
        });

        toast.success("XML importado com sucesso!");
      } catch (error) {
        console.error(error);
        toast.error("Erro ao processar XML.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAddManualItem = () => {
    if (!newItem.codigo || !newItem.descricao) {
      toast.error("Preencha código e descrição");
      return;
    }

    const qty = Math.max(1, parseInt(newItem.quantidade) || 1);
    const newProducts: any[] = [];

    for (let i = 0; i < qty; i++) {
      newProducts.push({
        codigo: newItem.codigo,
        descricao: newItem.descricao,
        nfInterna: newItem.nfInterna,
        quantidade: "1",
        recebido: false,
        status: "",
        itemAvaliado: "",
        avaliacaoItem: "",
        acao: "",
        referencia: "",
        fabricante: "",
        dataKit: "",
        itemReaproveitado: ""
      });
    }

    setFormData({
      ...formData,
      produtos: [...formData.produtos, ...newProducts]
    });

    setNewItem({ codigo: "", descricao: "", nfInterna: "", quantidade: "1" });
    toast.success("Produto adicionado manualmente!");
  };

  const handleSubmit = (finalize: boolean) => {
    toast.success(
      finalize ? "Análise finalizada com sucesso!" : "Laudo salvo com sucesso!"
    );
    if (finalize) {
      navigate("/laudo/novo", { state: { ...formData, pagamento } });
    } else {
      setTimeout(() => navigate("/"), 1000);
    }
  };

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
            select, input { display: none !important; }
            span { display: inline; }
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
            @media print {
              @page { size: A4 landscape; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

  const groupedProdutosCliente = formData.produtos
    .reduce((acc: any[], p: any) => {
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
    }, []);

  const groupedProdutosInterna = formData.produtos
    .reduce((acc: any[], p: any) => {
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
    }, []);

  const totalAprovadas = formData.produtos?.filter((p: any) => p.recebido && p.status === 'procedente').reduce((acc: number, p: any) => acc + Number(p.quantidadeRecebida || p.quantidade || 0), 0) || 0;
  const totalReprovadas = formData.produtos?.filter((p: any) => p.recebido && p.status === 'nao-procedente').reduce((acc: number, p: any) => acc + Number(p.quantidadeRecebida || p.quantidade || 0), 0) || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("analise")}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "analise"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
          1. Análise de Produtos
        </button>
        <button
          onClick={() => setActiveTab("cliente")}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "cliente"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
          2. Laudo Cliente
        </button>
        <button
          onClick={() => setActiveTab("interna")}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "interna"
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
        >
          3. Laudo Interno
        </button>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        {activeTab === "analise" ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Análise Técnica de Garantia
            </h3>

            {/* Dados da Nota Fiscal */}
            <div className="mb-8">
              <h4 className="text-md font-medium text-gray-700 mb-4 pb-2 border-b">
                Dados da Nota Fiscal
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <input
                    type="text"
                    value={formData.cliente}
                    readOnly={!!importedData}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${importedData ? "bg-gray-50" : ""}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NF Garantia</label>
                  <input
                    type="text"
                    value={formData.nfGarantia}
                    readOnly={!!importedData}
                    onChange={(e) => setFormData({ ...formData, nfGarantia: e.target.value })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${importedData ? "bg-gray-50" : ""}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NF Interna</label>
                  <input
                    type="text"
                    value={formData.nfInterna}
                    readOnly={!!importedData}
                    onChange={(e) => setFormData({ ...formData, nfInterna: e.target.value })}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${importedData ? "bg-gray-50" : ""}`}
                  />
                </div>
              </div>
            </div>

            <div className="mb-0">
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h4 className="text-md font-medium text-gray-700">Produtos do XML / Manual</h4>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 transition-colors cursor-pointer text-xs font-medium">
                    <FileDown size={14} />
                    Importar XML
                    <input type="file" accept=".xml" onChange={handleFileSelect} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Formulário de Adição Manual */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Código</label>
                    <input
                      type="text"
                      value={newItem.codigo}
                      onChange={(e) => setNewItem({ ...newItem, codigo: e.target.value })}
                      placeholder="92.357"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Descrição</label>
                    <input
                      type="text"
                      value={newItem.descricao}
                      onChange={(e) => setNewItem({ ...newItem, descricao: e.target.value })}
                      placeholder="Descrição do produto"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">NF Interna / Qtd</label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newItem.nfInterna}
                        onChange={(e) => setNewItem({ ...newItem, nfInterna: e.target.value })}
                        placeholder="NF"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        min="1"
                        value={newItem.quantidade}
                        onChange={(e) => setNewItem({ ...newItem, quantidade: e.target.value })}
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 text-center"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddManualItem}
                    className="h-9 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 text-sm font-medium"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>
              </div>

              {formData.produtos && formData.produtos.length > 0 && (
                <div className="mb-6 overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 border border-gray-200 rounded-lg">
                    <thead className="text-[10px] text-gray-700 uppercase bg-gray-50 font-bold">
                      <tr>
                        <th className="px-2 py-2 border-b text-center">Rec.</th>
                        <th className="px-2 py-2 border-b">Código</th>
                        <th className="px-2 py-2 border-b">Descrição</th>
                        <th className="px-2 py-2 border-b">Referência</th>
                        <th className="px-2 py-2 border-b">Fabricante</th>
                        <th className="px-2 py-2 border-b">Data Kit</th>
                        <th className="px-2 py-2 border-b text-center">QTD</th>
                        <th className="px-2 py-2 border-b">NF interna</th>
                        <th className="px-2 py-2 border-b">Item Avaliado</th>
                        <th className="px-2 py-2 border-b">Item Reaproveitado</th>
                        <th className="px-2 py-2 border-b">Status</th>
                        <th className="px-2 py-2 border-b">Resolução</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.produtos.map((p: any, i: number) => (
                        <tr key={i} className={`border-b transition-colors ${!p.recebido ? "bg-gray-50 opacity-60" : "bg-white hover:bg-gray-50"}`}>
                          <td className="px-2 py-3 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={p.recebido}
                              onChange={(e) => {
                                const newProdutos = [...formData.produtos];
                                newProdutos[i].recebido = e.target.checked;
                                if (!e.target.checked) {
                                  newProdutos[i].status = "";
                                  newProdutos[i].itemAvaliado = "";
                                  newProdutos[i].itemReaproveitado = "";
                                  newProdutos[i].avaliacaoItem = "";
                                  newProdutos[i].acao = "";
                                }
                                setFormData({ ...formData, produtos: newProdutos });
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-2 py-3 font-bold text-gray-900 whitespace-nowrap">{p.codigo}</td>
                          <td className="px-2 py-3 text-xs text-gray-600 max-w-[150px] truncate" title={p.descricao}>{p.descricao}</td>
                          <td className="px-2 py-2 min-w-[100px]">
                            <input
                              type="text"
                              value={p.referencia || ""}
                              disabled={!p.recebido}
                              placeholder="REF..."
                              onChange={(e) => {
                                const newProdutos = [...formData.produtos];
                                newProdutos[i].referencia = e.target.value;
                                setFormData({ ...formData, produtos: newProdutos });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[100px]">
                            <select
                              value={p.fabricante || ""}
                              disabled={!p.recebido}
                              onChange={(e) => {
                                const newProdutos = [...formData.produtos];
                                newProdutos[i].fabricante = e.target.value;
                                setFormData({ ...formData, produtos: newProdutos });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                            >
                              <option value="">Fabricante...</option>
                              <option value="Cofap">Cofap</option>
                              <option value="Nakata">Nakata</option>
                              <option value="Monroe">Monroe</option>
                              <option value="Axios">Axios</option>
                              <option value="Sampel">Sampel</option>
                              <option value="Outros">Outros</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 min-w-[80px]">
                            <input
                              type="text"
                              maxLength={4}
                              value={p.dataKit || ""}
                              disabled={!p.recebido}
                              placeholder="Ano..."
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                const newProdutos = [...formData.produtos];
                                newProdutos[i].dataKit = val;
                                setFormData({ ...formData, produtos: newProdutos });
                              }}
                              className="w-full px-1 py-1 border border-gray-300 rounded text-center text-xs focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                            />
                          </td>
                          <td className="px-2 py-3 text-center font-medium text-gray-900">
                            {p.quantidadeRecebida || p.quantidade}
                          </td>
                          <td className="px-2 py-3 text-xs text-blue-700 italic">{p.nfInterna || "-"}</td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <MultiSelect
                              options={ITEM_OPTIONS.filter(opt => p.descricao?.toLowerCase().includes(opt.toLowerCase()))}
                              selected={p.itemAvaliado ? p.itemAvaliado.split(", ").filter(Boolean) : []}
                              disabled={!p.recebido}
                              placeholder="Itens..."
                              themeColor="blue"
                              onChange={(selected) => {
                                const newProdutos = [...formData.produtos];
                                newProdutos[i].itemAvaliado = selected.join(", ");
                                setFormData({ ...formData, produtos: newProdutos });
                              }}
                            />
                          </td>
                          <td className="px-2 py-2 min-w-[140px]">
                            <MultiSelect
                              options={ITEM_OPTIONS.filter(opt => p.descricao?.toLowerCase().includes(opt.toLowerCase()))}
                              selected={p.itemReaproveitado ? p.itemReaproveitado.split(", ").filter(Boolean) : []}
                              disabled={!p.recebido}
                              placeholder="Reapr..."
                              themeColor="green"
                              onChange={(selected) => {
                                const newProdutos = [...formData.produtos];
                                newProdutos[i].itemReaproveitado = selected.join(", ");
                                setFormData({ ...formData, produtos: newProdutos });
                              }}
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={p.status}
                              disabled={!p.recebido}
                              onChange={(e) => {
                                const newProdutos = [...formData.produtos];
                                newProdutos[i].status = e.target.value;
                                setFormData({ ...formData, produtos: newProdutos });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                            >
                              <option value="">Status...</option>
                              <option value="procedente">Procedente</option>
                              <option value="nao-procedente">Não Proc.</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 min-w-[200px] space-y-1">
                            <textarea
                              value={p.avaliacaoItem}
                              disabled={!p.recebido}
                              onChange={(e) => {
                                const newProdutos = [...formData.produtos];
                                newProdutos[i].avaliacaoItem = e.target.value;
                                setFormData({ ...formData, produtos: newProdutos });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 outline-none resize-none disabled:bg-gray-100"
                              rows={2}
                              placeholder="Avaliação técnica..."
                            />
                            <select
                              value={p.acao}
                              disabled={!p.recebido}
                              onChange={(e) => {
                                const newProdutos = [...formData.produtos];
                                newProdutos[i].acao = e.target.value;
                                setFormData({ ...formData, produtos: newProdutos });
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-[10px] focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                            >
                              <option value="">Resolução...</option>
                              <option value="troca">Troca</option>
                              <option value="credito">Crédito</option>
                              <option value="devolucao">Devolução</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setActiveTab("cliente")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              >
                Próximo: Laudo Cliente
              </button>
            </div>
          </>
        ) : activeTab === "cliente" ? (
          <div className="space-y-8">
            <div id="print-laudo-cliente" className="border-2 border-gray-900 p-8 bg-white max-w-4xl mx-auto shadow-md">
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
                      {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 border-b-2 border-gray-900 text-sm">
                  <div className="border-r-2 border-gray-900 p-2"><div className="font-bold">CLIENTE:</div></div>
                  <div className="border-r-2 border-gray-900 p-2 text-center col-span-2"><div>{formData.cliente}</div></div>
                  <div className="border-r-2 border-gray-900 p-2"><div className="font-bold">NOTA Nº</div></div>
                  <div className="p-2 text-center"><div>{formData.nfGarantia}</div></div>
                </div>

                {formData.nfInterna && (
                  <div className="border-b-2 border-gray-900 p-2 text-xs">
                    <span className="font-bold uppercase">NF Internas: </span>
                    <span>{formData.nfInterna}</span>
                  </div>
                )}

                <div className="grid grid-cols-5 border-b-2 border-gray-900 bg-gray-50 uppercase">
                  <div className="border-r-2 border-gray-900 p-2 text-center"><div className="text-[10px] font-bold">PRODUTO</div></div>
                  <div className="border-r-2 border-gray-900 p-2 text-center"><div className="text-[10px] font-bold">QTD</div></div>
                  <div className="border-r-2 border-gray-900 p-2 text-center"><div className="text-[10px] font-bold">STATUS</div></div>
                  <div className="border-r-2 border-gray-900 p-2 text-center"><div className="text-[10px] font-bold">ITEM AVALIADO</div></div>
                  <div className="p-2 text-center"><div className="text-[10px] font-bold">RESOLUÇÃO</div></div>
                </div>

                {groupedProdutosCliente.map((p: any, index: number) => (
                  <div key={index} className={`grid grid-cols-5 ${index < groupedProdutosCliente.length - 1 ? "border-b border-gray-900" : ""} text-[10px] min-h-[40px]`}>
                    <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center font-bold">{p.codigo}</div>
                    <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center">{p.qtde}</div>
                    <div className="border-r-2 border-gray-900 p-1 text-center flex items-center justify-center whitespace-nowrap">{p.status}</div>
                    <div className="border-r-2 border-gray-900 p-1 flex items-start pl-2 italic leading-tight"><div>{p.item}</div></div>
                    <div className="p-1 text-center font-bold flex items-center justify-center uppercase">{p.acao}</div>
                  </div>
                ))}

                <div className="border-t-2 border-gray-900 p-3 text-xs">
                  <div className="mb-2"><strong>TOTAL DE PEÇAS EM GARANTIA APROVADAS:</strong> {totalAprovadas}</div>
                  <div className="mb-2 ml-16">ATENDIDAS: {totalAprovadas} // AGUARDANDO REPOSIÇÃO: 0</div>
                  <div><strong>TOTAL DE PEÇAS EM GARANTIA REPROVADAS:</strong> {totalReprovadas}</div>
                </div>
              </div>

              <div className="border-2 border-t-0 border-gray-900 mt-0 text-sm">
                <div className="grid grid-cols-2 border-b border-gray-900 text-xs text-center">
                  <div className="border-r border-gray-900 p-3">
                    <div className="mb-2 font-bold uppercase">Pagamento:</div>
                    <div className="flex gap-4 justify-center">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="pagamento_preview" checked={pagamento === "garantia"} onChange={() => setPagamento("garantia")} className="w-3 h-3" />
                        <span>Garantia</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" name="pagamento_preview" checked={pagamento === "bonificacao"} onChange={() => setPagamento("bonificacao")} className="w-3 h-3" />
                        <span>Bonificação</span>
                      </label>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-bold uppercase mb-4">Cliente:</div>
                    <div className="text-xs mb-1">{formData.cliente}</div>
                    <div className="border-t border-gray-400 w-32 mx-auto"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 border-b border-gray-900 text-xs h-12">
                  <div className="border-r border-gray-900 p-2">
                    <div className="font-bold uppercase">Data:</div>
                    <input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className="text-[10px] border-none p-0 focus:ring-0 w-full mt-1 bg-yellow-50/50" />
                  </div>
                  <div className="p-2">
                    <div className="font-bold uppercase mb-4 text-center">Validado por:</div>
                    <div className="border-t border-gray-400 w-32 mx-auto"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 text-xs h-12">
                  <div className="border-r border-gray-900 p-2">
                    <div className="font-bold uppercase">Doc: {formData.nfGarantia}</div>
                  </div>
                  <div className="p-2">
                    <div className="font-bold uppercase mb-4 text-center">Autorizado por:</div>
                    <div className="border-t border-gray-400 w-32 mx-auto"></div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center text-[10px]">
                <div className="border-t border-gray-400 w-48 mx-auto mb-1"></div>
                <div className="font-bold uppercase">Rodolfo Costa</div>
                <div>Departamento de Qualidade e Garantia</div>
                <div>Automotriz Indústria e Comércio de Peças Automotivas</div>
                <div>Tel(21) 96480-3390</div>
              </div>
            </div>

            <div className="flex gap-4 justify-between pt-6 border-t">
              <button onClick={() => setActiveTab("analise")} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Voltar para Análise
              </button>
              <div className="flex gap-3">
                <button onClick={() => handleSubmit(false)} className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
                  <Save size={16} />
                  Salvar
                </button>
                <button onClick={() => handlePrint('print-laudo-cliente')} className="px-5 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2">
                  <Printer size={16} />
                  Imprimir
                </button>
                <button onClick={() => setActiveTab("interna")} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Próximo: Laudo Interno
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div id="print-laudo-interna" className="border-2 border-gray-900 p-8 bg-white max-w-4xl mx-auto shadow-md">
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
                    <div className="text-sm">
                      {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 border-b-2 border-gray-900 text-sm">
                  <div className="border-r-2 border-gray-900 p-2"><div className="font-bold">CLIENTE:</div></div>
                  <div className="border-r-2 border-gray-900 p-2 text-center col-span-2"><div>{formData.cliente}</div></div>
                  <div className="border-r-2 border-gray-900 p-2"><div className="font-bold">NOTA Nº</div></div>
                  <div className="p-2 text-center"><div>{formData.nfGarantia}</div></div>
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
                    <div className="border-r-2 border-gray-900 p-1 flex items-center justify-center bg-white">
                      <span className="text-[9px] text-center">{p.referencia === '-' ? '' : p.referencia}</span>
                    </div>
                    <div className="border-r-2 border-gray-900 p-1 flex items-center justify-center bg-white">
                      <span className="text-[9px] text-center">{p.fabricante === '-' ? '' : p.fabricante}</span>
                    </div>
                    <div className="border-r-2 border-gray-900 p-1 flex items-center justify-center bg-white">
                      <span className="text-[9px] text-center">{p.dataKit === '-' ? '' : p.dataKit}</span>
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
            </div>

            <div className="flex gap-4 justify-between pt-6 border-t">
              <button onClick={() => setActiveTab("cliente")} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Voltar para Laudo Cliente
              </button>
              <div className="flex gap-3">
                <button onClick={() => handleSubmit(false)} className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
                  <Save size={16} />
                  Salvar
                </button>
                <button onClick={() => handlePrint('print-laudo-interna')} className="px-5 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2">
                  <Printer size={16} />
                  Imprimir
                </button>
                <button onClick={() => handleSubmit(true)} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Finalizar Análise
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
