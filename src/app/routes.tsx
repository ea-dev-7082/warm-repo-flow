import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { ImportXML } from "./components/ImportXML";
import { LaudoTecnico } from "./components/LaudoTecnico";
import { Historico } from "./components/Historico";
import { Relatorios } from "./components/Relatorios";
import { PlaceholderPage } from "./components/PlaceholderPage";
import { WarrantyReportDetails } from "./components/WarrantyReportDetails";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "nova-analise", Component: LaudoTecnico },
      { path: "importar-xml", Component: ImportXML },
      { path: "historico", Component: Historico },
      { path: "relatorios", Component: Relatorios },
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
