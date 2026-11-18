import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface ErpComponente {
  codigo: string;
  descricao: string;
  referencia: string;
  fabricanteCodigo: number | null;
  fabricante: string;
  qtdNoKit: number | null;
}

export interface ErpKit {
  kit: { codigo: string; descricao: string; referencia: string } | null;
  componentes: ErpComponente[];
}

async function invoke<T>(body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke("firebird-catalog", { body });
  if (error) {
    const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
    throw new Error(details);
  }
  return data as T;
}

export const getKitComposition = (code: string) =>
  invoke<ErpKit>({ op: "kit", code: code.trim().toUpperCase() });

export const getComponentsByCodes = async (codes: string[]) => {
  const unique = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))];
  if (unique.length === 0) return [] as ErpComponente[];
  const res = await invoke<{ componentes: ErpComponente[] }>({ op: "componentes", codes: unique });
  return res.componentes;
};
