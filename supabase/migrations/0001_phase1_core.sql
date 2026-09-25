-- APIEJ Platform — Phase 1 Core Migration
-- Postgres (Supabase-compatible) + PostGIS + RLS
-- Scope: Core CRM + Data Capture + RBAC. NO marketplace/broker tables beyond minimal listing stub.
-- Principle: current tables = live truth; *_snapshots = immutable quarterly history.

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists postgis;

-- ============================================================
-- 1. CATALOGS / ENUMS (as TEXT + CHECK for Supabase portability)
-- ============================================================
-- Organization types
-- Roles
-- Entity lifecycle status
-- Visibility levels
-- Availability states
-- Building classes (PCI/PCP support via class + corridor)

-- ============================================================
-- 2. IDENTITY & MULTI-TENANCY
-- ============================================================
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('APIEJ_INTERNAL','PARK_DEVELOPER','SUPPLIER','BROKER')),
  name text not null,
  rfc text,
  contact_email text,
  contact_phone text,
  membership_status text not null default 'ACTIVE' check (membership_status in ('ACTIVE','SUSPENDED','INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists profiles (
  user_id uuid primary key, -- references auth.users(id) in Supabase
  full_name text not null,
  phone text,
  avatar_url text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null check (key in ('SUPER_ADMIN','APIEJ_STAFF','PARK_OPERATOR','BROKER','SUPPLIER','PUBLIC')),
  description text not null
);

insert into roles (key, description) values
  ('SUPER_ADMIN','APIEJ full platform control'),
  ('APIEJ_STAFF','APIEJ validator / analyst'),
  ('PARK_OPERATOR','Park developer editor, tenant-isolated'),
  ('BROKER','Reserved for Phase 3, no grants in Phase 1'),
  ('SUPPLIER','Reserved for Phase 2, no grants in Phase 1'),
  ('PUBLIC','Anonymous marketplace visitor (Phase 4)')
on conflict (key) do nothing;

create table if not exists memberships (
  user_id uuid not null references profiles(user_id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  role_id uuid not null references roles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, org_id)
);
create index if not exists idx_memberships_user on memberships(user_id);
create index if not exists idx_memberships_org on memberships(org_id);

-- Helper: is the current user APIEJ staff? (used by RLS)
-- In Supabase this reads auth.uid(). For local Drizzle/testing the
-- equivalent check lives in apps/api/src/security/tenantGuard.ts.
create or replace function is_apiej_staff()
returns boolean language sql stable as $$
  select exists (
    select 1 from memberships m
    join roles r on r.id = m.role_id
    where m.user_id = auth.uid()
      and m.is_active = true
      and r.key in ('SUPER_ADMIN','APIEJ_STAFF')
  ) or exists (
    select 1 from profiles p where p.user_id = auth.uid() and p.is_super_admin = true
  );
$$;

create or replace function user_org_ids()
returns setof uuid language sql stable as $$
  select m.org_id from memberships m
  where m.user_id = auth.uid() and m.is_active = true;
$$;

-- ============================================================
-- 3. PERIODS (quarterly time axis — never mutated after close)
-- ============================================================
create table if not exists periods (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year between 2000 and 2100),
  quarter int not null check (quarter between 1 and 4),
  label text generated always as (year::text || '-Q' || quarter::text) stored,
  is_closed boolean not null default false,
  closed_at timestamptz,
  fx_usd_mxn numeric(10,4), -- Banxico reference frozen at close
  unique (year, quarter)
);

-- ============================================================
-- 4. INVENTORY (live truth — tenant scoped)
-- ============================================================
create table if not exists parks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete restrict,
  name text not null,
  slug text unique not null,
  municipality text not null,
  corridor text not null default 'Guadalajara Metro',
  address text,
  lat double precision,
  lng double precision,
  geom geography(Point, 4326),
  total_land_m2 numeric(14,2) not null default 0,
  developed_m2 numeric(14,2) not null default 0,
  reserve_m2 numeric(14,2) not null default 0,
  infrastructure jsonb not null default '{}',
  category text not null default 'PCI' check (category in ('PCI','PCP')),
  status text not null default 'DRAFT' check (status in ('DRAFT','PENDING_VALIDATION','VERIFIED','CHANGES_REQUESTED','REJECTED','ARCHIVED')),
  visibility text not null default 'PRIVATE' check (visibility in ('PRIVATE','SHARED','PUBLIC')),
  internal_notes text, -- SENSITIVE: APIEJ staff only
  validated_by uuid references profiles(user_id),
  validated_at timestamptz,
  created_by uuid references profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_parks_org on parks(org_id);
create index if not exists idx_parks_status on parks(status);
create index if not exists idx_parks_geo on parks using gist ((geom::geometry));

create table if not exists buildings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete restrict,
  park_id uuid references parks(id) on delete set null,
  code text not null,
  building_class text not null default 'A' check (building_class in ('A','A-','B','C')),
  total_gross_m2 numeric(14,2) not null default 0,
  net_rentable_m2 numeric(14,2) not null default 0,
  clear_height_m numeric(5,2),
  dock_doors int not null default 0,
  ramps int not null default 0,
  floor_load_t_m2 numeric(6,2),
  power_kva numeric(10,2),
  has_gas boolean not null default false,
  has_crane boolean not null default false,
  lat double precision,
  lng double precision,
  geom geography(Point, 4326),
  availability_state text not null default 'AVAILABLE' check (availability_state in ('AVAILABLE','RESERVED','LEASED','SOLD','UNDER_CONSTRUCTION','OFF_MARKET')),
  occupant_company_encrypted bytea, -- SENSITIVE: never exposed outside PRIVATE
  occupant_alias text, -- safe public alias, e.g. "Logistics tenant"
  asking_rent_usd_m2 numeric(10,2),
  asking_rent_mxn_m2 numeric(10,2),
  asking_sale_usd_m2 numeric(10,2),
  negotiated_price_note text, -- SENSITIVE: APIEJ staff only
  status text not null default 'DRAFT' check (status in ('DRAFT','PENDING_VALIDATION','VERIFIED','CHANGES_REQUESTED','REJECTED','ARCHIVED')),
  visibility text not null default 'PRIVATE' check (visibility in ('PRIVATE','SHARED','PUBLIC')),
  created_by uuid references profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, code)
);
create index if not exists idx_buildings_org on buildings(org_id);
create index if not exists idx_buildings_park on buildings(park_id);

create table if not exists lands (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete restrict,
  park_id uuid references parks(id) on delete set null,
  name text not null,
  total_m2 numeric(14,2) not null default 0,
  sellable_m2 numeric(14,2) not null default 0,
  zoning text,
  topography text,
  price_sale_usd_m2 numeric(10,2),
  price_sale_mxn_m2 numeric(10,2),
  availability_state text not null default 'AVAILABLE' check (availability_state in ('AVAILABLE','RESERVED','SOLD','OFF_MARKET')),
  geom geography(Polygon, 4326),
  lat double precision,
  lng double precision,
  status text not null default 'DRAFT' check (status in ('DRAFT','PENDING_VALIDATION','VERIFIED','CHANGES_REQUESTED','REJECTED','ARCHIVED')),
  visibility text not null default 'PRIVATE' check (visibility in ('PRIVATE','SHARED','PUBLIC')),
  created_by uuid references profiles(user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_lands_org on lands(org_id);

-- Occupancy: links building -> occupant for a given period (drives absorption)
create table if not exists occupancies (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete restrict,
  period_id uuid not null references periods(id) on delete restrict,
  occupant_company_encrypted bytea, -- SENSITIVE
  leased_m2 numeric(14,2) not null check (leased_m2 >= 0),
  lease_start date,
  lease_end date,
  rent_usd_m2 numeric(10,2), -- SENSITIVE actual transacted rent
  is_confidential boolean not null default true,
  created_at timestamptz not null default now(),
  unique (building_id, period_id)
);
create index if not exists idx_occ_building on occupancies(building_id);
create index if not exists idx_occ_period on occupancies(period_id);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  category text not null,
  name text not null,
  coverage_municipalities text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. SNAPSHOTS (immutable quarterly history)
-- ============================================================
create table if not exists park_snapshots (
  id uuid primary key default gen_random_uuid(),
  park_id uuid not null references parks(id) on delete cascade,
  period_id uuid not null references periods(id) on delete restrict,
  total_inventory_m2 numeric(14,2) not null,
  vacant_m2 numeric(14,2) not null,
  leased_m2 numeric(14,2) not null,
  under_construction_m2 numeric(14,2) not null default 0,
  avg_ask_rent_usd numeric(10,2),
  avg_ask_rent_mxn numeric(10,2),
  avg_sale_usd numeric(10,2),
  vacancy_rate_pct numeric(6,3) generated always as (
    case when total_inventory_m2 > 0 then (vacant_m2 / total_inventory_m2 * 100) else 0 end
  ) stored,
  snapshot_hash text,
  created_by uuid references profiles(user_id),
  created_at timestamptz not null default now(),
  unique (park_id, period_id)
);

create table if not exists building_snapshots (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  period_id uuid not null references periods(id) on delete restrict,
  rentable_m2 numeric(14,2) not null,
  vacant_m2 numeric(14,2) not null,
  occupied_m2 numeric(14,2) not null,
  asking_rent_usd numeric(10,2),
  asking_rent_mxn numeric(10,2),
  availability_state text not null,
  created_at timestamptz not null default now(),
  unique (building_id, period_id)
);

-- Pre-aggregated market view per corridor/category/period (refreshed by close-period job)
create table if not exists market_aggregates (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references periods(id) on delete restrict,
  scope text not null, -- e.g. 'CORRIDOR:El Salto' | 'CATEGORY:PCI' | 'GLOBAL'
  total_inventory_m2 numeric(14,2) not null default 0,
  vacancy_rate_pct numeric(6,3) not null default 0,
  net_absorption_m2 numeric(14,2) not null default 0,
  gross_absorption_m2 numeric(14,2) not null default 0,
  avg_rent_usd_m2 numeric(10,2),
  avg_rent_mxn_m2 numeric(10,2),
  computed_at timestamptz not null default now(),
  unique (period_id, scope)
);

-- Absorption helper view: net = occupied(p) - occupied(p-1)
create or replace view v_building_absorption as
select
  cur.building_id,
  cur.period_id,
  (cur.occupied_m2 - coalesce(prev.occupied_m2, 0)) as net_absorption_m2
from building_snapshots cur
left join building_snapshots prev on prev.building_id = cur.building_id
  and prev.period_id in (
    select p2.id from periods p1
    join periods p2 on p2.year * 4 + p2.quarter = p1.year * 4 + p1.quarter - 1
    where p1.id = cur.period_id
  );

-- ============================================================
-- 6. VALIDATION WORKFLOW + AUDIT
-- ============================================================
create table if not exists validation_reviews (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('PARK','BUILDING','LAND')),
  entity_id uuid not null,
  from_status text not null,
  to_status text not null,
  reviewer_id uuid references profiles(user_id),
  submitted_by uuid references profiles(user_id),
  comment_public text, -- visible to operator
  notes_internal text, -- SENSITIVE: staff only
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_entity on validation_reviews(entity_type, entity_id);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(user_id),
  org_id uuid references organizations(id),
  action text not null check (action in ('CREATE','UPDATE','STATUS_CHANGE','PUBLISH','EXPORT','SNAPSHOT_CLOSE')),
  entity_type text not null,
  entity_id uuid,
  diff jsonb,
  ip text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_entity on audit_logs(entity_type, entity_id);

-- ============================================================
-- 7. ROW LEVEL SECURITY (backend enforcement — never frontend)
-- ============================================================
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;
alter table parks enable row level security;
alter table buildings enable row level security;
alter table lands enable row level security;
alter table occupancies enable row level security;
alter table services enable row level security;
alter table periods enable row level security;
alter table park_snapshots enable row level security;
alter table building_snapshots enable row level security;
alter table market_aggregates enable row level security;
alter table validation_reviews enable row level security;
alter table audit_logs enable row level security;

-- Organizations: member of org OR staff
drop policy if exists org_isolation on organizations;
create policy org_isolation on organizations
  using (id in (select user_org_ids()) or is_apiej_staff())
  with check (is_apiej_staff());

-- Parks / Buildings / Lands: tenant isolation + staff bypass
drop policy if exists tenant_isolation on parks;
create policy tenant_isolation on parks
  using (org_id in (select user_org_ids()) or is_apiej_staff())
  with check (org_id in (select user_org_ids()) or is_apiej_staff());

drop policy if exists tenant_isolation on buildings;
create policy tenant_isolation on buildings
  using (org_id in (select user_org_ids()) or is_apiej_staff())
  with check (org_id in (select user_org_ids()) or is_apiej_staff());

drop policy if exists tenant_isolation on lands;
create policy tenant_isolation on lands
  using (org_id in (select user_org_ids()) or is_apiej_staff())
  with check (org_id in (select user_org_ids()) or is_apiej_staff());

drop policy if exists tenant_isolation on occupancies;
create policy tenant_isolation on occupancies
  using (org_id in (select user_org_ids()) or is_apiej_staff())
  with check (org_id in (select user_org_ids()) or is_apiej_staff());

-- Periods: readable by any authenticated member; writable by staff only
drop policy if exists periods_read on periods;
create policy periods_read on periods for select using (auth.uid() is not null);
drop policy if exists periods_write on periods;
create policy periods_write on periods for all using (is_apiej_staff()) with check (is_apiej_staff());

-- Snapshots: immutable — no UPDATE/DELETE via API (only service_role close-period job)
drop policy if exists snapshots_read on park_snapshots;
create policy snapshots_read on park_snapshots for select
  using (exists (select 1 from parks p where p.id = park_snapshots.park_id and (p.org_id in (select user_org_ids()) or is_apiej_staff())));
drop policy if exists snapshots_read on building_snapshots;
create policy snapshots_read on building_snapshots for select
  using (exists (select 1 from buildings b where b.id = building_snapshots.building_id and (b.org_id in (select user_org_ids()) or is_apiej_staff())));

-- Aggregates: shared read for members, write staff only
drop policy if exists agg_read on market_aggregates;
create policy agg_read on market_aggregates for select using (auth.uid() is not null);
drop policy if exists agg_write on market_aggregates;
create policy agg_write on market_aggregates for all using (is_apiej_staff()) with check (is_apiej_staff());

-- Audit logs: staff read only; inserts via trigger (see below)
drop policy if exists audit_staff_read on audit_logs;
create policy audit_staff_read on audit_logs for select using (is_apiej_staff());

-- ============================================================
-- 8. PUBLIC-SAFE VIEWS (column stripping for SHARED/PUBLIC)
-- NOTE: anon/marketplace must ONLY query these views, never base tables.
-- ============================================================
create or replace view public_parks as
select id, name, slug, municipality, corridor, address, lat, lng,
       total_land_m2, developed_m2, category, status, visibility
from parks
where status = 'VERIFIED' and visibility = 'PUBLIC';

create or replace view public_buildings as
select id, park_id, code, building_class, total_gross_m2, net_rentable_m2,
       clear_height_m, dock_doors, ramps, availability_state,
       asking_rent_usd_m2, asking_rent_mxn_m2, asking_sale_usd_m2,
       occupant_alias, status, visibility
from buildings
where status = 'VERIFIED' and visibility = 'PUBLIC';

-- Shared-portal view: verified + SHARED/PUBLIC, still WITHOUT sensitive cols
create or replace view shared_buildings as
select id, org_id, park_id, code, building_class, total_gross_m2, net_rentable_m2,
       clear_height_m, dock_doors, ramps, floor_load_t_m2, power_kva, has_gas,
       availability_state, asking_rent_usd_m2, asking_rent_mxn_m2,
       occupant_alias, status, visibility, updated_at
from buildings
where status = 'VERIFIED' and visibility in ('SHARED','PUBLIC');

-- ============================================================
-- 9. TRIGGERS: updated_at + audit + snapshot immutability guard
-- ============================================================
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_parks_touch on parks;
create trigger trg_parks_touch before update on parks for each row execute function touch_updated_at();
drop trigger if exists trg_buildings_touch on buildings;
create trigger trg_buildings_touch before update on buildings for each row execute function touch_updated_at();
drop trigger if exists trg_lands_touch on lands;
create trigger trg_lands_touch before update on lands for each row execute function touch_updated_at();

-- Audit trigger (fires on parks/buildings/lands status + data changes)
create or replace function log_entity_change() returns trigger language plpgsql as $$
begin
  insert into audit_logs (actor_id, org_id, action, entity_type, entity_id, diff)
  values (
    auth.uid(),
    coalesce(new.org_id, old.org_id),
    case when TG_OP = 'INSERT' then 'CREATE'::text else 'UPDATE'::text end,
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    jsonb_build_object('old_status', old.status, 'new_status', new.status)
  );
  return new;
end $$;

drop trigger if exists trg_audit_parks on parks;
create trigger trg_audit_parks after insert or update on parks for each row execute function log_entity_change();
drop trigger if exists trg_audit_buildings on buildings;
create trigger trg_audit_buildings after insert or update on buildings for each row execute function log_entity_change();
drop trigger if exists trg_audit_lands on lands;
create trigger trg_audit_lands after insert or update on lands for each row execute function log_entity_change();

-- Snapshot immutability: reject UPDATE/DELETE on closed periods
create or replace function guard_snapshot_immutable() returns trigger language plpgsql as $$
declare _closed boolean;
begin
  select is_closed into _closed from periods where id = coalesce(new.period_id, old.period_id);
  if _closed then
    raise exception 'Snapshot frozen: period is closed (historical integrity)';
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists trg_freeze_park_snap on park_snapshots;
create trigger trg_freeze_park_snap before update or delete on park_snapshots for each row execute function guard_snapshot_immutable();
drop trigger if exists trg_freeze_bld_snap on building_snapshots;
create trigger trg_freeze_bld_snap before update or delete on building_snapshots for each row execute function guard_snapshot_immutable();
