import { RouterProvider } from "react-router-dom";
import { LaudosProvider } from "./contexts/LaudosContext";
import { router } from "./routes";
import { Toaster } from "sonner";

export default function App() {
  return (
    <LaudosProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </LaudosProvider>
  );
}
