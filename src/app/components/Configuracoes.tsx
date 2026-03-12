import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { 
  UserPlus, 
  Users, 
  Settings2, 
  Save, 
  UserCog, 
  Shield, 
  Phone, 
  Building2, 
  Briefcase,
  Loader2,
  Trash2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  cargo: string | null;
  empresa: string | null;
  avatar_url: string | null;
  created_at: string;
  sig_empresa: string | null;
  sig_departamento: string | null;
  sig_telefone: string | null;
}

interface UserRole {
  user_id: string;
  role: "admin" | "analista";
}

export function Configuracoes() {
  const { role, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "signatures">("users");
  const [profiles, setProfiles] = useState<(Profile & { role: string })[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Signature settings
  const [settings, setSettings] = useState({
    company_name: "Automotriz Indústria e Comércio de Peças Automotivas",
    department: "Departamento de Qualidade e Garantia",
    phone: "(21) 96480-3390"
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // New User Form
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: "",
    email: "",
    password: "",
    cargo: "",
    empresa: "",
    role: "analista" as "admin" | "analista"
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers();
      fetchSettings();
    }
  }, [role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .order("nome");
      
      if (pError) throw pError;

      const { data: rolesData, error: rError } = await supabase
        .from("user_roles")
        .select("*");
      
      if (rError) throw rError;

      const formattedUsers = profilesData.map(p => ({
        ...p,
        role: rolesData.find(r => r.user_id === p.user_id)?.role || "analista"
      })) as any;

      setProfiles(formattedUsers);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        // @ts-ignore
        .from("app_settings")
        .select("*");
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('relation "app_settings" does not exist')) {
          console.warn("Table app_settings not found, using defaults.");
          return;
        }
        throw error;
      }

      if (data && data.length > 0) {
        const newSettings = { ...settings };
        data.forEach((s: any) => {
          if (s.key in newSettings) {
             // @ts-ignore
            newSettings[s.key] = s.value;
          }
        });
        setSettings(newSettings);
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "admin" | "analista") => {
    if (userId === currentUser?.id) {
      toast.error("Você não pode alterar seu próprio cargo");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);
      
      if (error) throw error;
      
      toast.success("Cargo atualizado com sucesso");
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao atualizar cargo: " + error.message);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value
      }));

      // Upsert settings
      for (const item of updates) {
        const { error } = await supabase
          // @ts-ignore
          .from("app_settings")
          // @ts-ignore
          .upsert({ key: item.key, value: item.value }, { onConflict: 'key' });
        
        if (error) throw error;
      }

      toast.success("Configurações de assinatura salvas!");
    } catch (error: any) {
      toast.error("Erro ao salvar configurações. Certifique-se de que o SQL foi executado.");
      console.error(error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            nome: newUser.nome,
            cargo: newUser.cargo,
            empresa: newUser.empresa,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // 2. Set role (Trigger might handle profile, but let's be safe if it doesn't wait)
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({ 
          user_id: authData.user.id, 
          role: newUser.role 
        }, { onConflict: 'user_id' });

      if (roleError) throw roleError;

      toast.success("Usuário criado com sucesso!");
      setShowNewUserModal(false);
      setNewUser({ nome: "", email: "", password: "", cargo: "", empresa: "", role: "analista" });
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao criar usuário: " + error.message);
    } finally {
      setCreatingUser(false);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Shield size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-semibold">Acesso Restrito</h2>
        <p>Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-500">Gerencie usuários, permissões e padrões dos laudos.</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === "users" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={18} />
            Gestão de Usuários
          </div>
          {activeTab === "users" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("signatures")}
          className={`px-4 py-2 font-medium text-sm transition-colors relative ${
            activeTab === "signatures" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings2 size={18} />
            Assinaturas dos Usuários
          </div>
          {activeTab === "signatures" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {activeTab === "users" ? (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Usuários Ativos</h3>
              <button
                onClick={() => setShowNewUserModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <UserPlus size={18} />
                Adicionar Usuário
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                    <tr>
                      <th className="px-4 py-3">Nome / Cargo</th>
                      <th className="px-4 py-3">Roles</th>
                      <th className="px-4 py-3">Empresa</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                              {p.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{p.nome}</div>
                              <div className="text-xs text-gray-500">{p.cargo || "Não definido"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            p.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {p.role === 'admin' ? 'Administrador' : 'Analista'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {p.empresa || "-"}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <select 
                              value={p.role}
                              onChange={(e) => handleUpdateRole(p.user_id, e.target.value as any)}
                              className="text-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              disabled={p.user_id === currentUser?.id}
                            >
                              <option value="analista">Analista</option>
                              <option value="admin">Administrador</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gestão de Assinaturas</h3>
                <p className="text-sm text-gray-500">Visualize e edite as informações que aparecem nos laudos de cada usuário.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Empresa</th>
                    <th className="px-4 py-3">Departamento</th>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-gray-900">{p.nome}</td>
                      <td className="px-4 py-4">
                        <input 
                          type="text" 
                          value={p.sig_empresa || ""} 
                          onChange={(e) => {
                            const newProfiles = [...profiles];
                            const idx = newProfiles.findIndex(prof => prof.id === p.id);
                            newProfiles[idx].sig_empresa = e.target.value;
                            setProfiles(newProfiles);
                          }}
                          className="text-xs border-gray-200 rounded p-1 w-full"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input 
                          type="text" 
                          value={p.sig_departamento || ""} 
                          onChange={(e) => {
                            const newProfiles = [...profiles];
                            const idx = newProfiles.findIndex(prof => prof.id === p.id);
                            newProfiles[idx].sig_departamento = e.target.value;
                            setProfiles(newProfiles);
                          }}
                          className="text-xs border-gray-200 rounded p-1 w-full"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input 
                          type="text" 
                          value={p.sig_telefone || ""} 
                          onChange={(e) => {
                            const newProfiles = [...profiles];
                            const idx = newProfiles.findIndex(prof => prof.id === p.id);
                            newProfiles[idx].sig_telefone = e.target.value;
                            setProfiles(newProfiles);
                          }}
                          className="text-xs border-gray-200 rounded p-1 w-full"
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={async () => {
                            try {
                              const { error } = await supabase
                                .from("profiles")
                                .update({
                                  // @ts-ignore
                                  sig_empresa: p.sig_empresa,
                                  // @ts-ignore
                                  sig_departamento: p.sig_departamento,
                                  // @ts-ignore
                                  sig_telefone: p.sig_telefone
                                })
                                .eq("id", p.id);
                              if (error) throw error;
                              toast.success(`Assinatura de ${p.nome} atualizada!`);
                            } catch (e: any) {
                              toast.error("Erro ao atualizar: " + e.message);
                            }
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Save size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <UserCog size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Novo Usuário</h3>
                  <p className="text-sm text-gray-500">Cadastre um novo analista ou admin.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newUser.nome}
                    onChange={(e) => setNewUser({...newUser, nome: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha Provisória</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                    <input
                      type="text"
                      value={newUser.cargo}
                      onChange={(e) => setNewUser({...newUser, cargo: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="analista">Analista</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {creatingUser ? <Loader2 className="animate-spin" size={18} /> : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
