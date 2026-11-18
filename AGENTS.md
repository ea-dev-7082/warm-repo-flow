# AGENTS.md

- Code is organized by business feature under `src/features/<feature>/{pages,components,hooks,contexts,constants}`; why: keeps each area of the warranty system self-contained as it grows.
- Generic reusable UI lives in `src/components/{ui,layout,shared}` and cross-feature hooks/utils in `src/shared/`; why: features must not depend on each other's internals for generic pieces.
- Routes are defined in `src/routes/index.tsx`, app providers in `src/App.tsx`; why: single entry for navigation.
- Always import with the `@/` alias, never deep relative paths; why: files can move without breaking imports.
- Reference SQL schemas live in `docs/schemas/`, not under `src/`.
- Warranty reads use the security-invoker `laudos_leitura` view through `features/laudos/data/relational.ts`; writes use the authenticated atomic RPC and normalization triggers, keeping `xml_dados` as transition compatibility only; why: all screens consume the same three-level records without partial saves.
- ERP (Firebird) catalog reads go through the `firebird-catalog` edge function with named operations (`kit`, `componentes`) and React Query hooks in `src/features/laudos/hooks/useErpCatalog.ts`; the browser never sends SQL and never holds the API key.
