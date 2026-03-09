import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  History,
  BarChart3,
  Settings,
  Bell,
  User,
  Menu,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/nova-analise", label: "Nova análise", icon: FileText },
  { path: "/historico", label: "Histórico", icon: History },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, role, signOut } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-slate-900 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-semibold">Gestão de Garantias</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-slate-800">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.nome || "Usuário"}
                </p>
                <p className="text-xs text-slate-400 capitalize">{role || "analista"}</p>
              </div>
              <button
                onClick={signOut}
                title="Sair"
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={signOut}
              title="Sair"
              className="w-full flex justify-center p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {menuItems.find((item) => item.path === location.pathname)?.label || "Dashboard"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800 leading-none">
                    {profile?.nome || "Usuário"}
                  </p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">{role || "analista"}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
