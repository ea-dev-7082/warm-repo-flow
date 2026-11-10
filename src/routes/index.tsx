import { createBrowserRouter } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/features/dashboard/pages/Dashboard";
import { ImportXML } from "@/features/xml-import/pages/ImportXML";
import { LaudoTecnico } from "@/features/laudos/pages/LaudoTecnico";
import { Historico } from "@/features/laudos/pages/Historico";
import { Relatorios } from "@/features/laudos/pages/Relatorios";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { WarrantyReportDetails } from "@/features/laudos/pages/WarrantyReportDetails";
import { LaudosAbertos } from "@/features/laudos/pages/LaudosAbertos";
import { AuthPage } from "@/features/auth/pages/AuthPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { Configuracoes } from "@/features/configuracoes/pages/Configuracoes";
import { TratamentoFornecedor } from "@/features/fornecedor/pages/TratamentoFornecedor";

export const router = createBrowserRouter([
  {
    path: "/reset-password",
    Component: ResetPasswordPage,
  },
  {
    path: "/login",
    Component: AuthPage,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "nova-analise", Component: LaudoTecnico },
      { path: "importar-xml", Component: ImportXML },
      { path: "historico", Component: Historico },
      { path: "relatorios", Component: Relatorios },
      { path: "laudos-abertos", Component: LaudosAbertos },
      { path: "laudo/:id", Component: WarrantyReportDetails },
      {
        path: "produtos-problema",
        Component: () => <PlaceholderPage title="Produtos com problema" />,
      },
      {
        path: "tratamento-fornecedor",
        Component: TratamentoFornecedor,
      },
      {
        path: "estatisticas",
        Component: () => <PlaceholderPage title="Estatísticas" />,
      },
      {
        path: "configuracoes",
        Component: Configuracoes,
      },
    ],
  },
]);
