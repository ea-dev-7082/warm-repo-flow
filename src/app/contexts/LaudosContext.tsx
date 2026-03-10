import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type StatusLaudo = 'aberto' | 'finalizado';

export interface Laudo {
    id: string; // Gerado ou vindo da NF
    cliente: string;
    nfGarantia: string;
    data: string;
    statusLaudo: StatusLaudo;
    responsavel?: string;
    responsavelId?: string;
    produtos?: any[];
    notaPaga?: string;
    [key: string]: any;
}

interface LaudosContextData {
    laudos: Laudo[];
    loading: boolean;
    adicionarLaudo: (laudo: Omit<Laudo, 'id' | 'statusLaudo'> & { id?: string, statusLaudo?: StatusLaudo }) => Promise<string | null>;
    atualizarLaudo: (id: string, dados: Partial<Laudo>) => Promise<void>;
    removerLaudo: (id: string) => Promise<void>;
}

const LaudosContext = createContext<LaudosContextData | undefined>(undefined);

export function LaudosProvider({ children }: { children: ReactNode }) {
    const [laudos, setLaudos] = useState<Laudo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLaudos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('laudos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedLaudos: Laudo[] = data.map(item => ({
                    id: item.id,
                    cliente: item.cliente_nome,
                    nfGarantia: item.nf_garantia,
                    data: (item.xml_dados as any)?.data || item.created_at,
                    statusLaudo: (item.status === 'Finalizado' || item.status === 'finalizado') ? 'finalizado' : 'aberto',
                    responsavel: item.responsavel_nome || undefined,
                    responsavelId: item.responsavel_id || undefined,
                    produtos: (item.xml_dados as any)?.produtos || [],
                    ...(item.xml_dados as any || {}),
                }));
                setLaudos(mappedLaudos);
            }
        } catch (error) {
            console.error('Erro ao buscar laudos:', error);
            toast.error('Erro ao carregar laudos do banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLaudos();
    }, []);

    const adicionarLaudo = async (laudoData: Omit<Laudo, 'id' | 'statusLaudo'> & { id?: string, statusLaudo?: StatusLaudo }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const statusLaudo = laudoData.statusLaudo || 'aberto';
            const dbStatus = statusLaudo === 'finalizado' ? 'Finalizado' : 'Em análise';

            const { data, error } = await supabase
                .from('laudos')
                .insert({
                    cliente_nome: laudoData.cliente,
                    nf_garantia: laudoData.nfGarantia,
                    status: dbStatus,
                    responsavel_nome: laudoData.responsavel,
                    responsavel_id: user.id,
                    produto_descricao: laudoData.produtos?.[0]?.descricao || 'Vários produtos',
                    produto_codigo: laudoData.produtos?.[0]?.codigo || '',
                    xml_dados: laudoData as any,
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const novoLaudo: Laudo = {
                    ...laudoData,
                    id: data.id,
                    statusLaudo,
                    responsavelId: user.id,
                } as Laudo;

                setLaudos(prev => [novoLaudo, ...prev]);
                return data.id;
            }
            return null;
        } catch (error) {
            console.error('Erro ao adicionar laudo:', error);
            toast.error('Erro ao salvar laudo no banco de dados.');
            return null;
        }
    };

    const atualizarLaudo = async (id: string, dados: Partial<Laudo>) => {
        try {
            const updatePayload: any = {};
            if (dados.cliente) updatePayload.cliente_nome = dados.cliente;
            if (dados.nfGarantia) updatePayload.nf_garantia = dados.nfGarantia;
            if (dados.statusLaudo) {
                updatePayload.status = dados.statusLaudo === 'finalizado' ? 'Finalizado' : 'Em análise';
            }
            if (dados.responsavel) updatePayload.responsavel_nome = dados.responsavel;

            // Re-fetch current data to merge xml_dados
            const { data: current } = await supabase.from('laudos').select('xml_dados').eq('id', id).single();

            updatePayload.xml_dados = {
                ...(current?.xml_dados as any || {}),
                ...dados
            };

            const { error } = await supabase
                .from('laudos')
                .update(updatePayload)
                .eq('id', id);

            if (error) throw error;

            setLaudos((prev) =>
                prev.map((laudo) => (laudo.id === id ? { ...laudo, ...dados } : laudo))
            );
        } catch (error) {
            console.error('Erro ao atualizar laudo:', error);
            toast.error('Erro ao atualizar laudo no banco de dados.');
        }
    };

    const removerLaudo = async (id: string) => {
        try {
            const { error } = await supabase
                .from('laudos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setLaudos((prev) => prev.filter((laudo) => laudo.id !== id));
            toast.success('Laudo removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover laudo:', error);
            toast.error('Erro ao remover laudo do banco de dados.');
        }
    };

    return (
        <LaudosContext.Provider value={{ laudos, loading, adicionarLaudo, atualizarLaudo, removerLaudo }}>
            {children}
        </LaudosContext.Provider>
    );
}

export function useLaudos() {
    const context = useContext(LaudosContext);
    if (context === undefined) {
        throw new Error('useLaudos must be used within a LaudosProvider');
    }
    return context;
}
