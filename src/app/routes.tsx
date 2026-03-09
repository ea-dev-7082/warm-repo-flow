import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ImportXML } from "./components/ImportXML";
import { LaudoTecnico } from "./components/LaudoTecnico";
import { Historico } from "./components/Historico";
import { Relatorios } from "./components/Relatorios";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { WarrantyReportDetails } from "./components/WarrantyReportDetails";
import { LaudosAbertos } from "./components/LaudosAbertos";
import { AuthPage } from "./components/auth/AuthPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

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
        path: "estatisticas",
        Component: () => <PlaceholderPage title="Estatísticas" />,
      },
      {
        path: "configuracoes",
        Component: () => <PlaceholderPage title="Configurações" />,
      },
    ],
  },
]);
