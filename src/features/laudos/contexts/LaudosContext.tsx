import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchRelationalLaudos, mapRelationalLaudo, saveRelationalLaudo } from '@/features/laudos/data/relational';

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

export interface Cadastro {
    cnpj: string;
    nome: string;
    classe: 'cliente' | 'fornecedor' | 'transportadora';
    inscricao_estadual?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cep?: string;
    uf?: string;
    cidade?: string;
    id_fnc?: number | null;
    [key: string]: any;
}

interface LaudosContextData {
    laudos: Laudo[];
    cadastros: Cadastro[];
    loading: boolean;
    adicionarLaudo: (laudo: Omit<Laudo, 'id' | 'statusLaudo'> & { id?: string, statusLaudo?: StatusLaudo }) => Promise<string | null>;
    atualizarLaudo: (id: string, dados: Partial<Laudo>) => Promise<void>;
    removerLaudo: (id: string) => Promise<void>;
    fetchCadastros: () => Promise<void>;
}

const LaudosContext = createContext<LaudosContextData | undefined>(undefined);

export function LaudosProvider({ children }: { children: ReactNode }) {
    const [laudos, setLaudos] = useState<Laudo[]>([]);
    const [cadastros, setCadastros] = useState<Cadastro[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLaudos = async () => {
        try {
            setLoading(true);
            const data = await fetchRelationalLaudos();

            if (data) {
                const mappedLaudos: Laudo[] = data.map(mapRelationalLaudo);
                setLaudos(mappedLaudos);
            }
        } catch (error) {
            console.error('Erro ao buscar laudos:', error);
            toast.error('Erro ao carregar laudos do banco de dados.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCadastros = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('cadastros')
                .select('*')
                .order('nome');
            if (error) throw error;
            setCadastros(data || []);
        } catch (error) {
            console.error('Erro ao buscar cadastros:', error);
        }
    };

    useEffect(() => {
        fetchLaudos();
        fetchCadastros();
    }, []);

    const adicionarLaudo = async (laudoData: Omit<Laudo, 'id' | 'statusLaudo'> & { id?: string, statusLaudo?: StatusLaudo }) => {
        try {
            const novoLaudo = await saveRelationalLaudo(null, { ...laudoData, statusLaudo: laudoData.statusLaudo || 'aberto' });
            setLaudos(prev => [novoLaudo, ...prev]);
            return novoLaudo.id;
        } catch (error) {
            console.error('Erro ao adicionar laudo:', error);
            toast.error('Erro ao salvar laudo no banco de dados.');
            return null;
        }
    };

    const atualizarLaudo = async (id: string, dados: Partial<Laudo>) => {
        try {
            const atualizado = await saveRelationalLaudo(id, dados);
            setLaudos((prev) =>
                prev.map((laudo) => (laudo.id === id ? atualizado : laudo))
            );
        } catch (error) {
            console.error('Erro ao atualizar laudo:', error);
            toast.error('Erro ao atualizar laudo no banco de dados.');
            throw error;
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
        <LaudosContext.Provider value={{ laudos, cadastros, loading, adicionarLaudo, atualizarLaudo, removerLaudo, fetchCadastros }}>
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
