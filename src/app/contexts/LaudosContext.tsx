import React, { createContext, useContext, useState, ReactNode } from 'react';

export type StatusLaudo = 'aberto' | 'finalizado';

export interface Laudo {
    id: string; // Gerado ou vindo da NF
    cliente: string;
    nfGarantia: string;
    data: string;
    statusLaudo: StatusLaudo;
    // TODO: mais campos, como produtos etc.
    [key: string]: any;
}

interface LaudosContextData {
    laudos: Laudo[];
    adicionarLaudo: (laudo: Omit<Laudo, 'id' | 'statusLaudo'> & { id?: string, statusLaudo?: StatusLaudo }) => string;
    atualizarLaudo: (id: string, dados: Partial<Laudo>) => void;
    removerLaudo: (id: string) => void;
}

const LaudosContext = createContext<LaudosContextData | undefined>(undefined);

export function LaudosProvider({ children }: { children: ReactNode }) {
    const [laudos, setLaudos] = useState<Laudo[]>([]);

    const adicionarLaudo = (laudoData: Omit<Laudo, 'id' | 'statusLaudo'> & { id?: string, statusLaudo?: StatusLaudo }) => {
        const id = laudoData.id || `LAUDO-${Date.now()}`;
        const novoLaudo = {
            ...laudoData,
            id,
            statusLaudo: laudoData.statusLaudo || 'aberto',
        } as Laudo;

        setLaudos((prev) => {
            // Evitar duplicidade pelo ID se já existir
            const existe = prev.findIndex(l => l.id === id);
            if (existe >= 0) {
                const novos = [...prev];
                novos[existe] = novoLaudo;
                return novos;
            }
            return [novoLaudo, ...prev];
        });

        return id;
    };

    const atualizarLaudo = (id: string, dados: Partial<Laudo>) => {
        setLaudos((prev) =>
            prev.map((laudo) => (laudo.id === id ? { ...laudo, ...dados } : laudo))
        );
    };

    const removerLaudo = (id: string) => {
        setLaudos((prev) => prev.filter((laudo) => laudo.id !== id));
    };

    return (
        <LaudosContext.Provider value={{ laudos, adicionarLaudo, atualizarLaudo, removerLaudo }}>
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
