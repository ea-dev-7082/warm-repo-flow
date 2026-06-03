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
  FolderOpen,
  LogOut,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { FloatingSupportChat } from "./FloatingSupportChat";
import { useNotifications } from "../hooks/useNotifications";

const menuItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/nova-analise", label: "Nova análise", icon: FileText },
  { path: "/laudos-abertos", label: "Laudos Abertos", icon: FolderOpen },
  { path: "/historico", label: "Histórico", icon: History },
  { path: "/tratamento-fornecedor", label: "Tratamento ao Fornecedor", icon: Truck },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { profile, role, signOut } = useAuth();
  const { notifications } = useNotifications();

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
            // Only show settings to admins
            if (item.path === "/configuracoes" && role !== "admin") return null;

            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-slate-800 hover:text-white"
                  }`}
              >
                <Icon size={24} />
                {sidebarOpen && <span className="text-lg">{item.label}</span>}
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
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                >
                  <Bell size={20} className="text-gray-600" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                      <h3 className="font-semibold text-gray-900">Notificações</h3>
                      <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                        {notifications.length}
                      </span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div 
                            key={notif.id}
                            className="p-4 border-b border-gray-50 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                            onClick={() => {
                              setIsNotificationsOpen(false);
                              if(notif.actionUrl) {
                                window.location.href = notif.actionUrl;
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                notif.type === 'error' ? 'bg-red-500' :
                                notif.type === 'warning' ? 'bg-orange-500' :
                                notif.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                              }`} />
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-700 transition-colors">{notif.title}</h4>
                                <p className="text-xs text-gray-600 leading-snug">{notif.message}</p>
                                <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                                  {new Date(notif.timestamp).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center">
                          <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500 text-sm">Nenhuma notificação no momento.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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
      <FloatingSupportChat />
    </div>
  );
}
