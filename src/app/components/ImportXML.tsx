import { FileUpload } from "./FileUpload";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { XMLParser } from "fast-xml-parser";
import { useLaudos } from "../contexts/LaudosContext";
import { AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
    ncm: string;
    unidade: string;
    vUnit: string;
    vProd: string;
  }>;
}

export function ImportXML() {
  const [xmlData, setXmlData] = useState<XMLData | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const navigate = useNavigate();
  const { laudos } = useLaudos();

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
              nfInterna: nfMatch ? nfMatch[1] : "",
              ncm: det.prod?.NCM || "",
              unidade: det.prod?.uCom || "",
              vUnit: det.prod?.vUnCom || "",
              vProd: det.prod?.vUnCom || ""
            });
          }
        });

        const formattedGarantia = nfGarantia.toString();

        // Check for duplicates
        const existingLaudo = laudos.find(l => 
          l.nfGarantia === formattedGarantia && 
          l.cliente.trim().toUpperCase() === cliente.trim().toUpperCase()
        );

        if (existingLaudo) {
          setDuplicateId(existingLaudo.id);
          toast.warning("Atenção: Este XML (NF " + formattedGarantia + ") já foi importado anteriormente!");
        } else {
          setDuplicateId(null);
        }

        setXmlData({
          cliente,
          nfGarantia: formattedGarantia,
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
    if (duplicateId && !showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }
    navigate("/nova-analise", { state: xmlData });
  };

  return (
    <div className="w-full">
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
              onClick={() => {
                setXmlData(null);
                setDuplicateId(null);
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Importar outro arquivo
            </button>
          </div>

          {duplicateId && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="text-red-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="text-red-900 font-bold text-sm">Atenção: XML Duplicado</h4>
                <p className="text-red-700 text-xs mt-1">
                  Este arquivo XML (NF {xmlData.nfGarantia}) já foi lido e processado anteriormente no sistema para o cliente {xmlData.cliente}.
                </p>
                <div className="mt-3">
                  <button 
                    onClick={() => navigate(`/laudo/${duplicateId}`)}
                    className="flex items-center gap-1.5 text-xs font-bold text-red-900 hover:underline"
                  >
                    <ExternalLink size={14} />
                    Ver laudo existente
                  </button>
                </div>
              </div>
            </div>
          )}

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
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg transition-all font-bold text-lg active:scale-95 flex items-center gap-2"
            >
              Criar Laudo
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-gray-100">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Nota Fiscal já Importada</h3>
              <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                O sistema detectou que a <span className="font-bold text-gray-900">NF {xmlData?.nfGarantia}</span> do cliente <span className="font-bold text-gray-900">{xmlData?.cliente}</span> já possui um laudo registrado.
              </p>
              <p className="text-gray-700 mt-4 font-semibold">
                Deseja criar uma nova análise mesmo assim?
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex flex-col gap-2">
              <button
                onClick={() => navigate("/nova-analise", { state: xmlData })}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md active:scale-[0.98]"
              >
                Sim, Continuar Importação
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all active:scale-[0.98]"
              >
                Não, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
