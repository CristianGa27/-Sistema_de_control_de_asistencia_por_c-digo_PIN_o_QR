-- =====================================================================
--  Sistema de control de asistencia (Cédula / PIN / QR)
--  Ejecutar completo en Supabase → SQL Editor
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
do $$ begin
  create type tipo_marcacion as enum ('entrada', 'salida');
exception when duplicate_object then null; end $$;

do $$ begin
  create type metodo_marcacion as enum ('documento', 'pin', 'qr', 'manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_marcacion as enum ('a_tiempo', 'tarde');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------
create table if not exists horarios (
  id int generated always as identity primary key,
  nombre text not null,
  hora_entrada time not null,
  hora_salida time,
  tolerancia_min int not null default 10 check (tolerancia_min >= 0),
  created_at timestamptz not null default now()
);

create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  documento text unique not null check (length(documento) between 5 and 20),
  pin text unique check (pin ~ '^[0-9]{4}$'),            -- PIN de 4 dígitos (opcional)
  qr_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  nombre text not null,
  apellido text not null,
  area text,
  foto_url text,                                         -- URL pública en Storage (bucket 'fotos')
  horario_id int references horarios(id) on delete set null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists marcaciones (
  id bigint generated always as identity primary key,
  persona_id uuid not null references personas(id) on delete cascade,
  tipo tipo_marcacion not null,
  metodo metodo_marcacion not null,
  estado estado_marcacion,                               -- solo para entradas
  minutos_tarde int not null default 0,
  marcado_en timestamptz not null default now(),
  dispositivo text,
  corregido_por uuid references auth.users(id),
  nota text
);

create index if not exists marcaciones_persona_fecha_idx on marcaciones (persona_id, marcado_en desc);
create index if not exists marcaciones_fecha_idx on marcaciones (marcado_en);

create table if not exists perfiles_admin (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol text not null default 'admin',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------
create or replace function inicio_dia_local()
returns timestamptz language sql stable as $$
  select date_trunc('day', now() at time zone 'America/Bogota') at time zone 'America/Bogota';
$$;

create or replace function es_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles_admin where id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Registrar marcación (entrada/salida automática + puntualidad)
--   p_codigo : cédula, PIN o token QR
--   p_metodo : 'documento' (cédula o PIN escrito) | 'qr'
-- ---------------------------------------------------------------------
create or replace function registrar_marcacion(
  p_codigo text,
  p_metodo metodo_marcacion,
  p_dispositivo text default null
)
returns json
language plpgsql security definer set search_path = public as $$
declare
  v_persona personas;
  v_ultima marcaciones;
  v_hay_ultima boolean;
  v_tipo tipo_marcacion;
  v_metodo metodo_marcacion := p_metodo;
  v_horario horarios;
  v_estado estado_marcacion;
  v_min_tarde int := 0;
  v_hora_local time := (now() at time zone 'America/Bogota')::time;
  v_nueva marcaciones;
begin
  p_codigo := trim(coalesce(p_codigo, ''));

  if p_metodo = 'qr' then
    select * into v_persona from personas where activo and qr_token = p_codigo;
  else
    select * into v_persona from personas where activo and documento = p_codigo;
    if not found then
      select * into v_persona from personas where activo and pin = p_codigo;
      if found then v_metodo := 'pin'; end if;
    else
      v_metodo := 'documento';
    end if;
  end if;

  if v_persona.id is null then
    return json_build_object('ok', false, 'error', 'Código no válido');
  end if;

  -- Bloquea a la persona para evitar marcaciones simultáneas
  perform 1 from personas where id = v_persona.id for update;

  select * into v_ultima from marcaciones
   where persona_id = v_persona.id and marcado_en >= inicio_dia_local()
   order by marcado_en desc limit 1;
  v_hay_ultima := found;

  if v_hay_ultima and v_ultima.marcado_en > now() - interval '60 seconds' then
    return json_build_object(
      'ok', false, 'error', 'Ya marcaste hace un momento',
      'nombre', v_persona.nombre || ' ' || v_persona.apellido,
      'foto', v_persona.foto_url);
  end if;

  v_tipo := case when v_hay_ultima and v_ultima.tipo = 'entrada' then 'salida' else 'entrada' end;

  if v_tipo = 'entrada' then
    select * into v_horario from horarios where id = v_persona.horario_id;
    if found and v_hora_local > v_horario.hora_entrada + make_interval(mins => v_horario.tolerancia_min) then
      v_estado := 'tarde';
      v_min_tarde := floor(extract(epoch from (v_hora_local - v_horario.hora_entrada)) / 60);
    else
      v_estado := 'a_tiempo';
    end if;
  end if;

  insert into marcaciones (persona_id, tipo, metodo, estado, minutos_tarde, dispositivo)
  values (v_persona.id, v_tipo, v_metodo, v_estado, v_min_tarde, p_dispositivo)
  returning * into v_nueva;

  return json_build_object(
    'ok', true,
    'tipo', v_tipo,
    'estado', v_estado,
    'minutos_tarde', v_min_tarde,
    'hora', v_nueva.marcado_en,
    'nombre', v_persona.nombre || ' ' || v_persona.apellido,
    'foto', v_persona.foto_url);
end $$;

revoke all on function registrar_marcacion(text, metodo_marcacion, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Vista: estado de cada persona hoy (filtrar tipo = 'entrada' para presentes)
-- ---------------------------------------------------------------------
create or replace view estado_hoy with (security_invoker = true) as
select distinct on (m.persona_id)
  p.id as persona_id,
  p.nombre,
  p.apellido,
  p.area,
  p.foto_url,
  m.tipo as ultimo_tipo,
  m.marcado_en as ultima_marca,
  (select e.marcado_en from marcaciones e
    where e.persona_id = m.persona_id and e.tipo = 'entrada' and e.marcado_en >= inicio_dia_local()
    order by e.marcado_en asc limit 1) as primera_entrada,
  (select e.estado from marcaciones e
    where e.persona_id = m.persona_id and e.tipo = 'entrada' and e.marcado_en >= inicio_dia_local()
    order by e.marcado_en asc limit 1) as estado_llegada,
  (select e.minutos_tarde from marcaciones e
    where e.persona_id = m.persona_id and e.tipo = 'entrada' and e.marcado_en >= inicio_dia_local()
    order by e.marcado_en asc limit 1) as minutos_tarde
from marcaciones m
join personas p on p.id = m.persona_id
where m.marcado_en >= inicio_dia_local()
order by m.persona_id, m.marcado_en desc;

-- ---------------------------------------------------------------------
-- Seguridad (RLS): solo administradores acceden a las tablas.
-- El kiosco usa Server Actions con la service_role key (solo servidor).
-- ---------------------------------------------------------------------
alter table horarios enable row level security;
alter table personas enable row level security;
alter table marcaciones enable row level security;
alter table perfiles_admin enable row level security;

drop policy if exists admin_horarios on horarios;
create policy admin_horarios on horarios for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists admin_personas on personas;
create policy admin_personas on personas for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists admin_marcaciones on marcaciones;
create policy admin_marcaciones on marcaciones for all to authenticated using (es_admin()) with check (es_admin());

drop policy if exists admin_ver_perfil on perfiles_admin;
create policy admin_ver_perfil on perfiles_admin for select to authenticated using (id = auth.uid());

-- ---------------------------------------------------------------------
-- Storage: bucket público para fotos
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists fotos_admin_insert on storage.objects;
create policy fotos_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and es_admin());

drop policy if exists fotos_admin_update on storage.objects;
create policy fotos_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and es_admin());

drop policy if exists fotos_admin_delete on storage.objects;
create policy fotos_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and es_admin());

-- ---------------------------------------------------------------------
-- Datos de ejemplo y usuario administrador
-- ---------------------------------------------------------------------
insert into horarios (nombre, hora_entrada, hora_salida, tolerancia_min)
select 'Jornada general', '08:00', '17:00', 10
where not exists (select 1 from horarios);

insert into perfiles_admin (id, nombre, rol)
select id, 'Administrador', 'admin'
from auth.users
on conflict (id) do nothing;


