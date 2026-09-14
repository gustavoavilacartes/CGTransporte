-- ============================================================
-- Tabla: infracciones_velocidad
-- Módulo: Infracciones de velocidad
-- Portal: Desempeño de Flota (ARAUCO)
-- ============================================================

create table if not exists infracciones_velocidad (
  id_alarma        bigint primary key,
  tipo_alarma      text,
  referencia       text,
  detalle_alarma   text,
  numero_eventos   integer,
  codigo_vehiculo  text,
  patente          text,
  fecha_alarma     timestamp,
  id_giro          bigint,
  longitud         numeric,
  latitud          numeric,
  zona_camion      text,
  velocidad        numeric,
  limite           numeric,
  holgura          numeric,
  ruta             text,
  rut_conductor    text,
  nombre_conductor text,
  empresa          text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Índices para los filtros/consultas más frecuentes del dashboard
create index if not exists idx_infracciones_velocidad_fecha
  on infracciones_velocidad (fecha_alarma);

create index if not exists idx_infracciones_velocidad_patente
  on infracciones_velocidad (patente);

create index if not exists idx_infracciones_velocidad_zona
  on infracciones_velocidad (zona_camion);

create index if not exists idx_infracciones_velocidad_empresa
  on infracciones_velocidad (empresa);

-- Mantiene updated_at al día en cada upsert
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_infracciones_velocidad_updated_at on infracciones_velocidad;

create trigger trg_infracciones_velocidad_updated_at
  before update on infracciones_velocidad
  for each row
  execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- Sin roles/permisos definidos aún: acceso completo (select/insert/
-- update/delete) para cualquier usuario autenticado, nada para anon.
-- Ajustar cuando se defina el modelo de roles (Forestal/zona/etc.).
-- ============================================================

alter table infracciones_velocidad enable row level security;

drop policy if exists "authenticated_select" on infracciones_velocidad;
create policy "authenticated_select"
  on infracciones_velocidad
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated_insert" on infracciones_velocidad;
create policy "authenticated_insert"
  on infracciones_velocidad
  for insert
  to authenticated
  with check (true);

drop policy if exists "authenticated_update" on infracciones_velocidad;
create policy "authenticated_update"
  on infracciones_velocidad
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated_delete" on infracciones_velocidad;
create policy "authenticated_delete"
  on infracciones_velocidad
  for delete
  to authenticated
  using (true);
