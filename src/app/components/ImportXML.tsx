import { FileUpload } from "./FileUpload";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { XMLParser } from "fast-xml-parser";

interface XMLData {
  cliente: string;
  nfGarantia: string;
  nfInterna: string;
  produto: string;
  quantidade: string;
  produtos: Array<{
    codigo: string;
    descricao: string;
    quantidade: string;
    nfInterna: string;
  }>;
}

export function ImportXML() {
  const [xmlData, setXmlData] = useState<XMLData | null>(null);
  const navigate = useNavigate();

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const xmlText = e.target?.result as string;
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_"
        });
        const jsonObj = parser.parse(xmlText);

        const infNFe = jsonObj?.nfeProc?.NFe?.infNFe || jsonObj?.NFe?.infNFe;
        if (!infNFe) {
          throw new Error("Formato XML não reconhecido ou infNFe não encontrado");
        }

        const cliente = infNFe.emit?.xNome || "Não identificado";
        const nfGarantia = infNFe.ide?.nNF || "Não identificado";

        let dets = infNFe.det;
        if (!Array.isArray(dets)) {
          dets = dets ? [dets] : [];
        }

        const nfInternas: string[] = [];
        let produtosDesc: string[] = [];
        let totalQuantidade = 0;

        dets.forEach((det: any) => {
          const infAdProd = det.infAdProd || "";
          const prodDesc = det.prod?.xProd || "";
          const qCom = parseFloat(det.prod?.qCom || "0");

          produtosDesc.push(prodDesc);
          totalQuantidade += qCom;

          const nfMatch = infAdProd.match(/NF\.?\s*(\d+)/i);
          if (nfMatch && nfMatch[1]) {
            nfInternas.push(nfMatch[1]);
          }
        });

        const nfInternaFormatada = nfInternas.length > 0 ? nfInternas.join(";") + ";" : "";

        const produtosMapeados: any[] = [];
        dets.forEach((det: any) => {
          const infAdProd = det.infAdProd || "";
          const nfMatch = infAdProd.match(/NF\.?\s*(\d+)/i);
          const qCom = Math.floor(parseFloat(det.prod?.qCom || "0"));

          for (let i = 0; i < qCom; i++) {
            produtosMapeados.push({
              codigo: det.prod?.cProd || "N/A",
              descricao: det.prod?.xProd || "N/A",
              quantidade: "1",
              nfInterna: nfMatch ? nfMatch[1] : ""
            });
          }
        });

        setXmlData({
          cliente,
          nfGarantia: nfGarantia.toString(),
          nfInterna: nfInternaFormatada,
          produto: produtosDesc.length > 1 ? "Múltiplos produtos" : (produtosDesc[0] || "Não identificado"),
          quantidade: totalQuantidade.toString(),
          produtos: produtosMapeados,
        });
      } catch (error) {
        console.error("Erro ao processar o XML:", error);
        alert("Erro ao processar o arquivo XML. Verifique o console para mais detalhes.");
      }
    };
    reader.readAsText(file);
  };

  const handleCreateLaudo = () => {
    navigate("/nova-analise", { state: xmlData });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {!xmlData ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Importar arquivo XML
          </h3>
          <FileUpload
            onFileSelect={handleFileSelect}
            accept=".xml"
            label="Arraste o XML aqui ou selecione um arquivo"
          />
          <p className="text-sm text-gray-500 mt-4 text-center">
            O sistema irá ler automaticamente os dados da nota fiscal
          </p>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Dados importados do XML
            </h3>
            <button
              onClick={() => setXmlData(null)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Importar outro arquivo
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <input
                type="text"
                value={xmlData.cliente}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NF Garantia
                </label>
                <input
                  type="text"
                  value={xmlData.nfGarantia}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NF Interna
                </label>
                <input
                  type="text"
                  value={xmlData.nfInterna}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Produto
              </label>
              <input
                type="text"
                value={xmlData.produto}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade Total
              </label>
              <input
                type="text"
                value={xmlData.quantidade}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Produtos Identificados (Unitários)
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border-b">Código</th>
                      <th className="px-4 py-2 border-b">Descrição</th>
                      <th className="px-4 py-2 border-b text-center">Qtd</th>
                      <th className="px-4 py-2 border-b">NF Interna</th>
                    </tr>
                  </thead>
                  <tbody>
                    {xmlData.produtos.map((p, i) => (
                      <tr key={i} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-900">{p.codigo}</td>
                        <td className="px-4 py-2">{p.descricao}</td>
                        <td className="px-4 py-2 text-center">{p.quantidade}</td>
                        <td className="px-4 py-2">{p.nfInterna || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleCreateLaudo}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Criar Laudo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
