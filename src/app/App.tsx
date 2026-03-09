import { RouterProvider } from "react-router-dom";
import { LaudosProvider } from "./contexts/LaudosContext";
import { router } from "./routes";
import { Toaster } from "sonner";
import { AuthProvider } from "./hooks/useAuth";

export default function App() {
  return (
    <AuthProvider>
      <LaudosProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </LaudosProvider>
    </AuthProvider>
  );
}
