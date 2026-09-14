-- ============================================================
-- Tabla: giros
-- Módulos: Rendimiento de flota + Productividad
-- Fuente: reporte "GirosRango" (mismo origen para ambos módulos)
-- ============================================================

create table if not exists giros (
  id_giro             bigint primary key,
  proyecto            text,
  tipo_giro           text,
  estado_giro         text,
  tipo_cierre         text,

  patente             text,
  categoria           text,
  zona_camion         text,
  empresa_transporte  text,

  producto            text,
  clase_material       text,
  volumen             numeric,
  origen              text,
  destino             text,
  grua_carga          text,
  grua_descarga       text,

  fecha_llegada_origen   timestamp,
  fecha_carga            timestamp,
  fecha_sale_origen      timestamp,
  fecha_llegada_destino  timestamp,
  fecha_descarga         timestamp,
  fecha_sale_destino     timestamp,
  tiempo_carguio_min     numeric,

  km_totales    numeric,
  km_ripio      numeric,
  km_tierra     numeric,
  km_pavimento  numeric,

  responsable_evento   text,
  descripcion_evento   text,
  grupo_causal         text,
  fecha_evento         timestamp,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_giros_fecha_llegada_origen
  on giros (fecha_llegada_origen);

create index if not exists idx_giros_patente
  on giros (patente);

create index if not exists idx_giros_zona_camion
  on giros (zona_camion);

create index if not exists idx_giros_estado_giro
  on giros (estado_giro);

create index if not exists idx_giros_grupo_causal
  on giros (grupo_causal);

-- Reutiliza la función set_updated_at() creada para infracciones_velocidad.
-- Si esta tabla se corre en un proyecto/base donde esa función aún no existe,
-- descomenta el bloque de abajo.

-- create or replace function set_updated_at()
-- returns trigger as $$
-- begin
--   new.updated_at = now();
--   return new;
-- end;
-- $$ language plpgsql;

drop trigger if exists trg_giros_updated_at on giros;

create trigger trg_giros_updated_at
  before update on giros
  for each row
  execute function set_updated_at();

-- ============================================================
-- Row Level Security — mismo criterio temporal que infracciones_velocidad:
-- anon + authenticated habilitados hasta implementar login/roles.
-- ============================================================

alter table giros enable row level security;

drop policy if exists "anon_authenticated_select" on giros;
create policy "anon_authenticated_select"
  on giros
  for select
  to anon, authenticated
  using (true);

drop policy if exists "anon_authenticated_insert" on giros;
create policy "anon_authenticated_insert"
  on giros
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anon_authenticated_update" on giros;
create policy "anon_authenticated_update"
  on giros
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "anon_authenticated_delete" on giros;
create policy "anon_authenticated_delete"
  on giros
  for delete
  to anon, authenticated
  using (true);
