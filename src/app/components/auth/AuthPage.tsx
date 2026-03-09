import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

type AuthView = "login" | "register" | "forgot-password";

export function AuthPage() {
  const [view, setView] = useState<AuthView>("login");

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Gestão de Garantias</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de análise técnica</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {view === "login" && (
            <LoginForm
              onForgotPassword={() => setView("forgot-password")}
              onRegister={() => setView("register")}
            />
          )}
          {view === "register" && (
            <RegisterForm onLogin={() => setView("login")} />
          )}
          {view === "forgot-password" && (
            <ForgotPasswordForm onBack={() => setView("login")} />
          )}
        </div>
      </div>
    </div>
  );
}
