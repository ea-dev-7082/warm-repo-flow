import { Building2, Truck, ClipboardList, Edit2 } from "lucide-react";

interface DanfeMirrorProps {
  issuer: any;
  recipient: any;
  carrier: any;
  products: any[];
  responsible: string;
  complementaryInfo?: string;
  naturezaOperacao?: string;
  onNaturezaChange?: (value: string) => void;
}

export function DanfeMirror({ 
  issuer, 
  recipient, 
  carrier, 
  products, 
  responsible, 
  complementaryInfo,
  naturezaOperacao = "DEVOLUÇÃO DE MERCADORIA OU DEMONSTRAÇÃO",
  onNaturezaChange
}: DanfeMirrorProps) {
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="danfe-container bg-white text-[10px] font-sans leading-tight text-black p-4 w-full">
      <style>{`
        .danfe-box {
          border: 1px solid black;
          padding: 2px 4px;
          margin-bottom: -1px;
          margin-right: -1px;
        }
        .danfe-label {
          font-size: 7px;
          text-transform: uppercase;
          font-weight: bold;
          display: block;
          margin-bottom: 1px;
        }
        .danfe-value {
          font-weight: bold;
          font-size: 10px;
          display: block;
          min-height: 12px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        @media print {
          .danfe-container {
            padding: 0;
            width: 100% !important;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
        }
        .print-only { display: none; }
        
        .editable-field:hover {
          background-color: #f0f7ff;
          cursor: text;
        }
        .editable-field:focus-within {
          background-color: #f0f7ff;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
      `}</style>

      {/* RECEBEMOS DE... */}
      <div className="flex w-full mb-4">
        <div className="danfe-box flex-grow text-justify leading-none py-1">
          <span className="danfe-label">RECEBEMOS DE {issuer?.nome || "AUTOMOTRIZ PEÇAS"} OS PRODUTOS E/OU SERVIÇOS CONSTANTES DA NOTA FISCAL ELETRÔNICA INDICADA ABAIXO. EMISSÃO: {currentDate} VALOR TOTAL: R$ 0,00 DESTINATÁRIO: {recipient?.nome || "CONSULTE O FORNECEDOR"}</span>
        </div>
        <div className="danfe-box w-32 flex flex-col items-center justify-center">
          <span className="font-bold text-lg">NF-e</span>
          <span className="text-[8px]">Nº 000.000.000</span>
          <span className="text-[8px]">SÉRIE 0</span>
        </div>
      </div>

      <div className="flex w-full mb-4">
        <div className="danfe-box w-32 h-16">
          <span className="danfe-label">DATA DE RECEBIMENTO</span>
        </div>
        <div className="danfe-box flex-grow h-16">
          <span className="danfe-label">IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR</span>
        </div>
      </div>

      <div className="h-4 border-b-2 border-dashed border-black mb-4"></div>

      {/* DANFE IDENTIFICATION */}
      <div className="flex w-full">
        <div className="danfe-box w-1/3 p-4 flex flex-col items-center justify-center min-h-[100px]">
          <Building2 size={32} className="mb-2" />
          <span className="font-bold text-sm text-center">{issuer?.nome || "AUTOMOTRIZ INDÚSTRIA E COMÉRCIO"}</span>
          <span className="text-[8px] text-center">{issuer?.endereco || "RUA EXEMPLO"}, {issuer?.numero || "123"} - {issuer?.bairro || "BAIRRO"}</span>
          <span className="text-[8px] text-center">{issuer?.cidade || "CIDADE"} - {issuer?.uf || "UF"} - {issuer?.cep || "00000-000"}</span>
        </div>
        <div className="danfe-box w-1/6 flex flex-col items-center justify-center text-center">
          <span className="font-bold text-lg">DANFE</span>
          <span className="text-[7px]">Documento Auxiliar da Nota Fiscal Eletrônica</span>
          <div className="flex gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-[7px]">0 - ENTRADA</span>
              <span className="text-[7px]">1 - SAÍDA</span>
            </div>
            <div className="border border-black w-6 h-6 flex items-center justify-center font-bold">1</div>
          </div>
          <span className="font-bold mt-2">Nº 000.000.000</span>
          <span className="font-bold">SÉRIE 0</span>
          <span className="text-[7px]">Folha 1 / 1</span>
        </div>
        <div className="danfe-box flex-grow flex flex-col p-2">
          <div className="flex-grow flex items-center justify-center border-b border-black mb-2 pb-2">
            {/* Barcode Placeholder */}
            <div className="bg-black w-full h-8"></div>
          </div>
          <div>
            <span className="danfe-label">CHAVE DE ACESSO</span>
            <span className="danfe-value text-xs">0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000</span>
          </div>
          <div className="mt-2 text-center text-[7px]">
            Consulta de autenticidade no portal nacional da NF-e<br />
            www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora
          </div>
        </div>
      </div>

      <div className="flex w-full">
        <div className="danfe-box w-1/2 relative group editable-field transition-colors bg-blue-50/30">
          <div className="flex justify-between items-start">
            <span className="danfe-label">NATUREZA DA OPERAÇÃO</span>
            <Edit2 size={8} className="text-blue-400 no-print opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <input 
            type="text"
            value={naturezaOperacao}
            onChange={(e) => onNaturezaChange?.(e.target.value)}
            className="danfe-value text-xs w-full bg-transparent border-none outline-none p-0 h-auto focus:ring-0 no-print"
            placeholder="Clique para editar..."
          />
          <span className="danfe-value text-xs print-only font-bold">
            {naturezaOperacao}
          </span>
        </div>
        <div className="danfe-box flex-grow">
          <span className="danfe-label">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
          <span className="danfe-value text-xs">0000000000000000 - {currentDate} {currentTime}</span>
        </div>
      </div>

      <div className="flex w-full mb-2">
        <div className="danfe-box w-1/3">
          <span className="danfe-label">INSCRIÇÃO ESTADUAL</span>
          <span className="danfe-value">{issuer?.inscricao_estadual || "000000000000"}</span>
        </div>
        <div className="danfe-box w-1/3">
          <span className="danfe-label">INSCRIÇÃO ESTADUAL DO SUBST. TRIBUT.</span>
          <span className="danfe-value"></span>
        </div>
        <div className="danfe-box flex-grow">
          <span className="danfe-label">CNPJ</span>
          <span className="danfe-value">{issuer?.cnpj || "00.000.000/0000-00"}</span>
        </div>
      </div>

      {/* DESTINATÁRIO / REMETENTE */}
      <div className="bg-gray-100 font-bold px-2 border border-black border-b-0 text-[8px] uppercase">Destinatário/Remetente</div>
      <div className="flex w-full">
        <div className="danfe-box w-3/5">
          <span className="danfe-label">NOME / RAZÃO SOCIAL</span>
          <span className="danfe-value">{recipient?.nome || "NÃO INDICADO"}</span>
        </div>
        <div className="danfe-box w-1/5">
          <span className="danfe-label">CNPJ/CPF</span>
          <span className="danfe-value">{recipient?.cnpj || "00.000.000/0000-00"}</span>
        </div>
        <div className="danfe-box flex-grow">
          <span className="danfe-label">DATA DA EMISSÃO</span>
          <span className="danfe-value">{currentDate}</span>
        </div>
      </div>
      <div className="flex w-full">
        <div className="danfe-box w-2/5">
          <span className="danfe-label">ENDEREÇO</span>
          <span className="danfe-value">{recipient?.endereco || "ENDEREÇO NÃO CADASTRADO"} {recipient?.numero}</span>
        </div>
        <div className="danfe-box w-1/5">
          <span className="danfe-label">BAIRRO / DISTRITO</span>
          <span className="danfe-value">{recipient?.bairro || "-"}</span>
        </div>
        <div className="danfe-box w-1/5">
          <span className="danfe-label">CEP</span>
          <span className="danfe-value">{recipient?.cep || "00000-000"}</span>
        </div>
        <div className="danfe-box flex-grow">
          <span className="danfe-label">DATA DA SAÍDA/ENTRADA</span>
          <span className="danfe-value">{currentDate}</span>
        </div>
      </div>
      <div className="flex w-full mb-2">
        <div className="danfe-box w-1/3">
          <span className="danfe-label">MUNICÍPIO</span>
          <span className="danfe-value">{recipient?.cidade || "CIDADE"}</span>
        </div>
        <div className="danfe-box w-[40px]">
          <span className="danfe-label">UF</span>
          <span className="danfe-value">{recipient?.uf || "UF"}</span>
        </div>
        <div className="danfe-box w-1/5">
          <span className="danfe-label">FONE / FAX</span>
          <span className="danfe-value">{recipient?.fone || "(00) 0000-0000"}</span>
        </div>
        <div className="danfe-box w-1/5">
          <span className="danfe-label">INSCRIÇÃO ESTADUAL</span>
          <span className="danfe-value">{recipient?.inscricao_estadual || "ISENTO"}</span>
        </div>
        <div className="danfe-box flex-grow">
          <span className="danfe-label">HORA DA SAÍDA/ENTRADA</span>
          <span className="danfe-value">{currentTime}</span>
        </div>
      </div>

      {/* FATURA / DUPLICATAS */}
      <div className="bg-gray-100 font-bold px-2 border border-black border-b-0 text-[8px] uppercase">Fatura / Duplicatas</div>
      <div className="flex w-full mb-2">
        <div className="danfe-box flex-grow min-h-[16px]">
          <span className="danfe-label">NÚMERO, VENCIMENTO E VALOR</span>
          <span className="danfe-value text-[8px]">ESPELHO PARA CONFERÊNCIA - SEM VALOR DE FATURA</span>
        </div>
      </div>

      {/* CÁLCULO DO IMPOSTO */}
      <div className="bg-gray-100 font-bold px-2 border border-black border-b-0 text-[8px] uppercase">Cálculo do Imposto</div>
      <div className="flex w-full">
        <div className="danfe-box flex-grow"><span className="danfe-label">BASE DE CÁLCULO DO ICMS</span><span className="danfe-value text-right">0,00</span></div>
        <div className="danfe-box flex-grow"><span className="danfe-label">VALOR DO ICMS</span><span className="danfe-value text-right">0,00</span></div>
        <div className="danfe-box flex-grow"><span className="danfe-label">BASE DE CÁLCULO DO ICMS S.T.</span><span className="danfe-value text-right">0,00</span></div>
        <div className="danfe-box flex-grow"><span className="danfe-label">VALOR DO ICMS S.T.</span><span className="danfe-value text-right">0,00</span></div>
        <div className="danfe-box flex-grow"><span className="danfe-label">VALOR TOTAL DOS PRODUTOS</span><span className="danfe-value text-right">0,00</span></div>
      </div>
      <div className="flex w-full mb-2">
        <div className="danfe-box flex-grow"><span className="danfe-label">VALOR DO FRETE</span><span className="danfe-value text-right">0,00</span></div>
        <div className="danfe-box flex-grow"><span className="danfe-label">VALOR DO SEGURO</span><span className="danfe-value text-right">0,00</span></div>
        <div className="danfe-box flex-grow"><span className="danfe-label">DESCONTO</span><span className="danfe-value text-right">0,00</span></div>
        <div className="danfe-box flex-grow"><span className="danfe-label">OUTRAS DESPESAS ACESSÓRIAS</span><span className="danfe-value text-right">0,00</span></div>
        <div className="danfe-box flex-grow"><span className="danfe-label">VALOR DO IPI</span><span className="danfe-value text-right">0,00</span></div>
        <div className="danfe-box flex-grow"><span className="danfe-label">VALOR TOTAL DA NOTA</span><span className="danfe-value text-right">0,00</span></div>
      </div>

      {/* TRANSPORTADOR / VOLUMES TRANSPORTADOS */}
      <div className="bg-gray-100 font-bold px-2 border border-black border-b-0 text-[8px] uppercase">Transportador / Volumes Transportados</div>
      <div className="flex w-full">
        <div className="danfe-box w-3/5">
          <span className="danfe-label">RAZÃO SOCIAL</span>
          <span className="danfe-value">{carrier?.nome || "CONSULTE A TRANSPORTADORA"}</span>
        </div>
        <div className="danfe-box w-[80px]">
          <span className="danfe-label">FRETE POR CONTA</span>
          <span className="danfe-value">0 - EMITENTE</span>
        </div>
        <div className="danfe-box w-[80px]">
          <span className="danfe-label">CÓDIGO ANTT</span>
          <span className="danfe-value"></span>
        </div>
        <div className="danfe-box w-[80px]">
          <span className="danfe-label">PLACA DO VEÍCULO</span>
          <span className="danfe-value"></span>
        </div>
        <div className="danfe-box w-[40px]">
          <span className="danfe-label">UF</span>
          <span className="danfe-value"></span>
        </div>
        <div className="danfe-box flex-grow">
          <span className="danfe-label">CNPJ/CPF</span>
          <span className="danfe-value">{carrier?.cnpj || ""}</span>
        </div>
      </div>
      <div className="flex w-full mb-2">
        <div className="danfe-box w-2/3">
          <span className="danfe-label">ENDEREÇO</span>
          <span className="danfe-value">{carrier?.endereco} {carrier?.numero} {carrier?.bairro}</span>
        </div>
        <div className="danfe-box w-1/4">
          <span className="danfe-label">MUNICÍPIO</span>
          <span className="danfe-value">{carrier?.cidade}</span>
        </div>
        <div className="danfe-box w-[40px]">
          <span className="danfe-label">UF</span>
          <span className="danfe-value">{carrier?.uf}</span>
        </div>
        <div className="danfe-box flex-grow">
          <span className="danfe-label">INSCRIÇÃO ESTADUAL</span>
          <span className="danfe-value">{carrier?.inscricao_estadual || "ISENTO"}</span>
        </div>
      </div>

      {/* DADOS DOS PRODUTOS / SERVIÇOS */}
      <div className="bg-gray-100 font-bold px-2 border border-black border-b-0 text-[8px] uppercase">Dados dos Produtos / Serviços</div>
      <div className="border border-black min-h-[300px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-black text-[7px] font-bold">
              <th className="border-r border-black px-1 py-1 w-16">CÓDIGO</th>
              <th className="border-r border-black px-1 py-1">DESCRIÇÃO DOS PRODUTOS / SERVIÇOS</th>
              <th className="border-r border-black px-1 py-1 w-12">NCM/SH</th>
              <th className="border-r border-black px-1 py-1 w-8">CST</th>
              <th className="border-r border-black px-1 py-1 w-8">CFOP</th>
              <th className="border-r border-black px-1 py-1 w-8">UN</th>
              <th className="border-r border-black px-1 py-1 w-10">QUANT.</th>
              <th className="border-r border-black px-1 py-1 w-16">VALOR UNIT.</th>
              <th className="border-r border-black px-1 py-1 w-16">VALOR TOTAL</th>
              <th className="border-r border-black px-1 py-1 w-16">B.CÁLC. ICMS</th>
              <th className="border-r border-black px-1 py-1 w-16">VALOR ICMS</th>
              <th className="border-r border-black px-1 py-1 w-16">VALOR IPI</th>
              <th className="border-r border-black px-1 py-1 w-8">ALÍQ. ICMS</th>
              <th className="px-1 py-1 w-8">ALÍQ. IPI</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, idx) => (
              <tr key={idx} className="text-[7px]">
                <td className="border-r border-black px-1 py-0.5">{p.codigo}</td>
                <td className="border-r border-black px-1 py-0.5 truncate max-w-[200px]">{p.descricao || "PRODUTO GARANTIA"}</td>
                <td className="border-r border-black px-1 py-0.5"></td>
                <td className="border-r border-black px-1 py-0.5 text-center"></td>
                <td className="border-r border-black px-1 py-0.5 text-center"></td>
                <td className="border-r border-black px-1 py-0.5 text-center">UN</td>
                <td className="border-r border-black px-1 py-0.5 text-right">{p.quantidade || 1}</td>
                <td className="border-r border-black px-1 py-0.5 text-right">0,00</td>
                <td className="border-r border-black px-1 py-0.5 text-right">0,00</td>
                <td className="border-r border-black px-1 py-0.5 text-right">0,00</td>
                <td className="border-r border-black px-1 py-0.5 text-right">0,00</td>
                <td className="border-r border-black px-1 py-0.5 text-right">0,00</td>
                <td className="border-r border-black px-1 py-0.5 text-right">0</td>
                <td className="px-1 py-0.5 text-right">0</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CÁLCULO DO ISSQN */}
      <div className="bg-gray-100 font-bold px-2 border border-black border-b-0 text-[8px] uppercase">Cálculo do ISSQN</div>
      <div className="flex w-full mb-2">
        <div className="danfe-box w-1/4">
          <span className="danfe-label">INSCRIÇÃO MUNICIPAL</span>
          <span className="danfe-value"></span>
        </div>
        <div className="danfe-box w-1/4">
          <span className="danfe-label">VALOR TOTAL DOS SERVIÇOS</span>
          <span className="danfe-value text-right">0,00</span>
        </div>
        <div className="danfe-box w-1/4">
          <span className="danfe-label">BASE DE CÁLCULO DO ISSQN</span>
          <span className="danfe-value text-right">0,00</span>
        </div>
        <div className="danfe-box flex-grow">
          <span className="danfe-label">VALOR DO ISSQN</span>
          <span className="danfe-value text-right">0,00</span>
        </div>
      </div>

      {/* DADOS ADICIONAIS */}
      <div className="flex w-full mt-2">
        <div className="danfe-box w-2/3 min-h-[60px]">
          <span className="danfe-label">INFORMAÇÕES COMPLEMENTARES</span>
          <div className="text-[7px] leading-tight whitespace-pre-wrap">
            ESTE DOCUMENTO É UM ESPELHO PARA FINS DE CONFERÊNCIA LOGÍSTICA E NÃO POSSUI VALOR FISCAL.<br />
            RESPONSÁVEL PELA CONFERÊNCIA: {responsible.toUpperCase()}<br />
            {complementaryInfo && <><br />{complementaryInfo}<br /></>}
            MERCADORIA DESTINADA A GARANTIA CONFORME PROCEDIMENTO INTERNO.
          </div>
        </div>
        <div className="danfe-box flex-grow min-h-[60px]">
          <span className="danfe-label">RESERVADO AO FISCO</span>
        </div>
      </div>
    </div>
  );
}
