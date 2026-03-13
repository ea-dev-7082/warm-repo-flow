import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { 
  UserPlus, 
  Users, 
  Settings2, 
  Save, 
  UserCog, 
  Shield, 
  Briefcase,
  Loader2,
  Trash2,
  Search,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "./ui/SearchableSelect";

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

export function Configuracoes() {
  const { role, user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"users" | "signatures" | "records">("users");
  const [profiles, setProfiles] = useState<(Profile & { role: string })[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Master Records state
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordFilter, setRecordFilter] = useState<"cliente" | "fornecedor" | "transportadora">("cliente");
  const [recordSearch, setRecordSearch] = useState("");
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [newRecord, setNewRecord] = useState({
    cnpj: "",
    nome: "",
    classe: "cliente" as "cliente" | "fornecedor" | "transportadora",
    inscricao_estadual: "",
    email: "",
    fone: "",
    endereco: "",
    numero: "",
    bairro: "",
    cep: "",
    uf: "",
    estado: ""
  });

  // Signature settings (General/Legacy - keep for now if needed, but we focus on Profiles)
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
      fetchRecords();
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

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("cadastros")
        .select("*")
        .order("nome");
      
      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      console.error("Error fetching records:", error);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleCreateOrUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordsLoading(true);
    try {
      if (editingRecord) {
        const { error } = await (supabase as any)
          .from("cadastros")
          .update(newRecord)
          .eq("cnpj", editingRecord.cnpj);
        if (error) throw error;
        toast.success("Registro atualizado com sucesso!");
      } else {
        const { error } = await (supabase as any)
          .from("cadastros")
          .insert([newRecord]);
        if (error) throw error;
        toast.success("Registro criado com sucesso!");
      }
      setShowRecordModal(false);
      setEditingRecord(null);
      setNewRecord({
        cnpj: "", nome: "", classe: recordFilter, inscricao_estadual: "",
        email: "", fone: "", endereco: "", numero: "", bairro: "", cep: "", uf: "", estado: ""
      });
      fetchRecords();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleDeleteRecord = async (cnpj: string, nome: string) => {
    if (!window.confirm(`Excluir permanentemente o cadastro de ${nome}?`)) return;
    
    try {
      const { error } = await (supabase as any)
        .from("cadastros")
        .delete()
        .eq("cnpj", cnpj);
      if (error) throw error;
      toast.success("Registro excluído.");
      fetchRecords();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const authClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data: authData, error: authError } = await authClient.auth.signUp({
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

      await supabase
        .from("user_roles")
        .update({ role: newUser.role })
        .eq("user_id", authData.user.id);

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

  const handleDeleteUser = async (profileId: string, userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      toast.error("Você não pode excluir sua própria conta");
      return;
    }

    const confirmDelete = window.confirm(`Tem certeza que deseja excluir o usuário ${userName}?`);
    
    if (!confirmDelete) return;

    try {
      const { error: funcError } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (funcError) {
        toast.error("Erro ao remover conta de autenticação.");
        return;
      }

      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("user_id", userId);

      toast.success(`Usuário ${userName} excluído.`);
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao excluir usuário: " + error.message);
    }
  };

  const filteredRecords = records.filter(r => 
    r.classe === recordFilter &&
    r.nome?.toLowerCase().includes(recordSearch.toLowerCase())
  );

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
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
          <p className="text-gray-500">Gerencie usuários, permissões e cadastros mestres.</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium text-lg transition-colors relative ${
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
          className={`px-4 py-2 font-medium text-lg transition-colors relative ${
            activeTab === "signatures" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings2 size={18} />
            Assinaturas
          </div>
          {activeTab === "signatures" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("records")}
          className={`px-4 py-2 font-medium text-lg transition-colors relative ${
            activeTab === "records" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase size={18} />
            Gerenciar Cadastros
          </div>
          {activeTab === "records" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
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
                          <div className="font-medium text-gray-900">{p.nome}</div>
                          <div className="text-xs text-gray-500">{p.cargo || "Não definido"}</div>
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
                            <SearchableSelect
                              options={["analista", "admin"]}
                              value={p.role}
                              disabled={p.user_id === currentUser?.id}
                              onChange={(val) => handleUpdateRole(p.user_id, val as any)}
                            />
                            <button
                              onClick={() => handleDeleteUser(p.id, p.user_id, p.nome)}
                              className={`p-1.5 rounded transition-colors ${
                                p.user_id === currentUser?.id 
                                  ? "text-gray-300 cursor-not-allowed" 
                                  : "text-red-500 hover:bg-red-50"
                              }`}
                              disabled={p.user_id === currentUser?.id}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === "signatures" ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 font-bold">Gestão de Assinaturas</h3>
            <div className="overflow-x-auto border border-gray-100 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                  <tr>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Empresa na Assinatura</th>
                    <th className="px-4 py-3">Departamento</th>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 font-bold text-gray-900">{p.nome}</td>
                      <td className="px-4 py-4">
                        <input 
                          type="text" 
                          value={p.sig_empresa || ""} 
                          placeholder="Empresa..."
                          onChange={(e) => {
                            const newProfiles = [...profiles];
                            const idx = newProfiles.findIndex(prof => prof.id === p.id);
                            newProfiles[idx].sig_empresa = e.target.value;
                            setProfiles(newProfiles);
                          }}
                          className="text-xs border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input 
                          type="text" 
                          value={p.sig_departamento || ""} 
                          placeholder="Depto..."
                          onChange={(e) => {
                            const newProfiles = [...profiles];
                            const idx = newProfiles.findIndex(prof => prof.id === p.id);
                            newProfiles[idx].sig_departamento = e.target.value;
                            setProfiles(newProfiles);
                          }}
                          className="text-xs border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input 
                          type="text" 
                          value={p.sig_telefone || ""} 
                          placeholder="Fone..."
                          onChange={(e) => {
                            const newProfiles = [...profiles];
                            const idx = newProfiles.findIndex(prof => prof.id === p.id);
                            newProfiles[idx].sig_telefone = e.target.value;
                            setProfiles(newProfiles);
                          }}
                          className="text-xs border border-gray-300 rounded-lg p-2 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={async () => {
                            try {
                              const { error } = await (supabase as any)
                                .from("profiles")
                                .update({
                                  sig_empresa: p.sig_empresa,
                                  sig_departamento: p.sig_departamento,
                                  sig_telefone: p.sig_telefone
                                })
                                .eq("id", p.id);
                              if (error) throw error;
                              toast.success(`Assinatura de ${p.nome} salva!`);
                            } catch (e: any) {
                              toast.error("Erro ao salvar assinatura.");
                            }
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
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
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                {(["cliente", "fornecedor", "transportadora"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setRecordFilter(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                      recordFilter === type ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {type === "cliente" ? "Clientes" : type === "fornecedor" ? "Fornecedores" : "Transportadoras"}
                  </button>
                ))}

              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Buscar ${recordFilter}...`}
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingRecord(null);
                    setNewRecord({
                      cnpj: "", nome: "", classe: recordFilter, inscricao_estadual: "",
                      email: "", fone: "", endereco: "", numero: "", bairro: "", cep: "", uf: "", estado: ""
                    });
                    setShowRecordModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-bold flex items-center gap-2 whitespace-nowrap shadow-lg shadow-blue-200"
                >
                  <UserPlus size={18} />
                  Novo Cadastro
                </button>
              </div>
            </div>

            {recordsLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 size={40} className="animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Nome / Razão Social</th>
                      <th className="px-6 py-4">CNPJ</th>
                      <th className="px-6 py-4">Contato</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRecords.map((r) => (
                      <tr key={r.cnpj} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{r.nome}</div>
                          <div className="text-xs text-gray-400 italic">{r.classe}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                          {r.cnpj}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">{r.email || "-"}</div>
                          <div className="text-xs text-gray-400">{r.fone || "-"}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingRecord(r);
                                setNewRecord(r);
                                setShowRecordModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <UserCog size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord(r.cnpj, r.nome)}
                              className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRecords.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-32 text-center text-gray-400">
                          <Briefcase size={64} className="mx-auto opacity-5 mb-4" />
                          <p className="text-lg">Nenhum {recordFilter} encontrado.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Record Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Briefcase size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {editingRecord ? "Editar Cadastro" : "Novo Cadastro"}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">{recordFilter}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRecordModal(false)}
                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all text-2xl font-light"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateRecord} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nome / Razão Social</label>
                  <input
                    type="text" required
                    value={newRecord.nome}
                    onChange={(e) => setNewRecord({...newRecord, nome: e.target.value})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all text-base"
                    placeholder="Nome da empresa ou pessoa..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">CNPJ / CPF</label>
                  <input
                    type="text" required
                    disabled={!!editingRecord}
                    value={newRecord.cnpj}
                    placeholder="00.000.000/0000-00"
                    onChange={(e) => setNewRecord({...newRecord, cnpj: e.target.value})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all disabled:bg-gray-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={newRecord.inscricao_estadual}
                    onChange={(e) => setNewRecord({...newRecord, inscricao_estadual: e.target.value})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">E-mail de Contato</label>
                  <input
                    type="email"
                    value={newRecord.email}
                    onChange={(e) => setNewRecord({...newRecord, email: e.target.value})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Telefone</label>
                  <input
                    type="text"
                    value={newRecord.fone}
                    onChange={(e) => setNewRecord({...newRecord, fone: e.target.value})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all font-mono"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Endereço (Rua/Av)</label>
                  <input
                    type="text"
                    value={newRecord.endereco}
                    onChange={(e) => setNewRecord({...newRecord, endereco: e.target.value})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium"
                    placeholder="Nome da rua..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Número</label>
                  <input
                    type="text"
                    value={newRecord.numero}
                    onChange={(e) => setNewRecord({...newRecord, numero: e.target.value})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium"
                    placeholder="S/N, 123..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Bairro</label>
                  <input
                    type="text"
                    value={newRecord.bairro}
                    onChange={(e) => setNewRecord({...newRecord, bairro: e.target.value})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium"
                    placeholder="Nome do bairro..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">CEP</label>
                  <input
                    type="text"
                    value={newRecord.cep}
                    onChange={(e) => setNewRecord({...newRecord, cep: e.target.value})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium font-mono"
                    placeholder="00000-000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">UF</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newRecord.uf}
                    onChange={(e) => setNewRecord({...newRecord, uf: e.target.value.toUpperCase()})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium uppercase font-mono"
                    placeholder="RJ, SP..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Estado</label>
                  <input
                    type="text"
                    value={newRecord.estado}
                    onChange={(e) => setNewRecord({...newRecord, estado: e.target.value})}
                    className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all font-medium"
                    placeholder="Rio de Janeiro, São Paulo..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="flex-1 px-6 py-4 border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={recordsLoading}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-bold shadow-xl shadow-blue-200 transition-all disabled:opacity-50"
                >
                  {recordsLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : (editingRecord ? "Salvar Alterações" : "Criar Cadastro")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New User Modal */}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
              <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                <UserPlus size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Novo Usuário</h3>
                <p className="text-sm text-gray-500">Acesso ao sistema para novo colaborador</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
              <div className="space-y-4">
                <input
                  type="text" placeholder="Nome Completo" required
                  value={newUser.nome}
                  onChange={(e) => setNewUser({...newUser, nome: e.target.value})}
                  className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-600 transition-all"
                />
                <input
                  type="email" placeholder="E-mail Corporativo" required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-600 transition-all"
                />
                <input
                  type="password" placeholder="Senha Provisória" required minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-600 transition-all"
                />
                <div className="flex gap-4">
                  <input
                    type="text" placeholder="Cargo"
                    value={newUser.cargo}
                    onChange={(e) => setNewUser({...newUser, cargo: e.target.value})}
                    className="flex-1 px-5 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-600 transition-all"
                  />
                  <div className="w-32">
                    <SearchableSelect
                      options={["analista", "admin"]}
                      value={newUser.role}
                      onChange={(val) => setNewUser({...newUser, role: val as any})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="flex-1 px-6 py-4 border border-gray-200 text-gray-600 rounded-2xl hover:bg-gray-50 font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="flex-1 px-6 py-4 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 font-bold shadow-xl shadow-purple-200 transition-all disabled:opacity-50"
                >
                  {creatingUser ? <Loader2 className="animate-spin mx-auto" size={24} /> : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
