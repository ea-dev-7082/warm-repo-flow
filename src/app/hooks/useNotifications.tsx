import { useState, useEffect } from 'react';
import { useLaudos } from '../contexts/LaudosContext';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  actionUrl?: string;
}

export function useNotifications() {
  const { laudos } = useLaudos();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!laudos) return;

    const newNotifications: NotificationItem[] = [];
    const now = new Date();

    // 1. Rascunho Pendente
    const draft = localStorage.getItem('@comkit:laudo-tecnico-draft');
    if (draft) {
      newNotifications.push({
        id: 'draft',
        title: 'Rascunho Pendente',
        message: 'Você tem um laudo em rascunho aguardando finalização.',
        type: 'info',
        timestamp: now.toISOString(),
        actionUrl: '/nova-analise'
      });
    }

    // 2. Laudos Parados (Abertos > 5 dias)
    let laudosAbertosAtrasados = 0;
    laudos.forEach(laudo => {
      if (laudo.statusLaudo === 'aberto' || laudo.status === 'Em análise') {
        const dataLaudo = new Date(laudo.data || laudo.created_at || now);
        const diffTime = Math.abs(now.getTime() - dataLaudo.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 5) {
          laudosAbertosAtrasados++;
        }
      }
    });

    if (laudosAbertosAtrasados > 0) {
      newNotifications.push({
        id: 'pendentes',
        title: 'Laudos Pendentes',
        message: `Você tem ${laudosAbertosAtrasados} laudo(s) em aberto há mais de 5 dias!`,
        type: 'warning',
        timestamp: now.toISOString(),
        actionUrl: '/laudos-abertos'
      });
    }

    // 3. Pico de Defeitos (últimos 7 dias, > 3 ocorrências)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const productCounts: Record<string, number> = {};

    laudos.forEach(laudo => {
      const dataLaudo = new Date(laudo.data || laudo.created_at || now);
      if (dataLaudo >= sevenDaysAgo) {
        laudo.produtos?.forEach(p => {
          const desc = p.descricao || p.itemName || '';
          if (desc) {
            productCounts[desc] = (productCounts[desc] || 0) + 1;
          }
        });
      }
    });

    Object.entries(productCounts).forEach(([produto, count]) => {
      if (count > 3) {
        newNotifications.push({
          id: `pico-${produto}`,
          title: 'Pico de Defeitos Detectado',
          message: `Atenção: ${count} ocorrências de "${produto}" nos últimos 7 dias.`,
          type: 'error',
          timestamp: now.toISOString(),
          actionUrl: '/relatorios'
        });
      }
    });

    // 4. Atraso Fornecedor (Conferido > 30 dias atrás)
    let itensAtrasadosFornecedor = 0;
    laudos.forEach(laudo => {
      laudo.produtos?.forEach(p => {
        if (p.conferido && p.data_conferencia) {
          const dataConf = new Date(p.data_conferencia);
          const diffTime = Math.abs(now.getTime() - dataConf.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 30) {
            itensAtrasadosFornecedor++;
          }
        }
      });
    });

    if (itensAtrasadosFornecedor > 0) {
      newNotifications.push({
        id: 'fornecedor',
        title: 'Atraso de Fornecedor',
        message: `${itensAtrasadosFornecedor} item(ns) enviado(s) ao fornecedor aguardam resposta há mais de 30 dias.`,
        type: 'warning',
        timestamp: now.toISOString(),
        actionUrl: '/tratamento-fornecedor'
      });
    }

    // 5. Garantia de Alto Valor (vProd > R$ 2000 em laudos abertos)
    laudos.forEach(laudo => {
      if (laudo.statusLaudo === 'aberto' || laudo.status === 'Em análise') {
        let totalValor = 0;
        laudo.produtos?.forEach(p => {
          const v = parseFloat(String(p.vProd).replace(',', '.')) || 0;
          totalValor += v;
        });

        if (totalValor > 2000) {
          newNotifications.push({
            id: `alto-valor-${laudo.id}`,
            title: 'Garantia de Alto Valor',
            message: `A NF ${laudo.nfGarantia} (Cliente: ${laudo.cliente}) tem produtos somando R$ ${totalValor.toFixed(2).replace('.', ',')}.`,
            type: 'info',
            timestamp: now.toISOString(),
            actionUrl: `/laudo/${laudo.id}`
          });
        }
      }
    });

    setNotifications(newNotifications);
  }, [laudos]);

  return { notifications };
}
