import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { LaudosProvider } from "@/features/laudos/contexts/LaudosContext";
import { router } from "@/routes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LaudosProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" />
      </LaudosProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
}
