-- =============================================================================
-- DepositGuard: Database Schema, RLS Policies, Immutability Triggers, and Lock RPC
-- "tamper-evident, not tamper-proof" | "documentation, not legal advice"
-- =============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- Linked to Supabase Auth. Role is stored server-side and never trusted from client metadata.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    email text not null,
    full_name text,
    phone text,
    role text not null check (role in ('tenant', 'landlord')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- Trigger to create profile when auth.users is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name, phone, role)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'phone',
        coalesce(new.raw_user_meta_data->>'role', 'tenant')
    )
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. PROPERTIES TABLE
-- Landlord creates a property and generates an invite code.
-- -----------------------------------------------------------------------------
create table if not exists public.properties (
    id uuid default gen_random_uuid() primary key,
    landlord_id uuid references public.profiles(id) on delete restrict not null,
    title text not null,
    address text not null,
    city text not null,
    property_type text not null default 'flat' check (property_type in ('flat', 'pg', 'independent_house')),
    invite_code text unique not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 3. PROPERTY MEMBERS TABLE
-- Enforces one landlord and one tenant per property.
-- -----------------------------------------------------------------------------
create table if not exists public.property_members (
    id uuid default gen_random_uuid() primary key,
    property_id uuid references public.properties(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role text not null check (role in ('tenant', 'landlord')),
    joined_at timestamptz not null default timezone('utc', now()),
    constraint uq_property_user unique (property_id, user_id),
    constraint uq_property_role unique (property_id, role)
);

-- -----------------------------------------------------------------------------
-- 4. INSPECTIONS TABLE
-- State machine: draft -> pending_approval -> locked | disputed
-- -----------------------------------------------------------------------------
create table if not exists public.inspections (
    id uuid default gen_random_uuid() primary key,
    property_id uuid references public.properties(id) on delete cascade not null,
    type text not null default 'move_in' check (type in ('move_in', 'move_out')),
    status text not null default 'draft' check (status in ('draft', 'pending_approval', 'locked', 'disputed')),
    dispute_reason text,
    schema_version integer not null default 1,
    locked_hash text,
    locked_at timestamptz,
    created_by uuid references public.profiles(id) not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 5. ROOMS TABLE
-- Pre-populated rooms: Bedroom, Bathroom, Kitchen, Living Area, Appliances & Electricals
-- -----------------------------------------------------------------------------
create table if not exists public.rooms (
    id uuid default gen_random_uuid() primary key,
    inspection_id uuid references public.inspections(id) on delete cascade not null,
    name text not null,
    room_order integer not null default 0,
    created_at timestamptz not null default timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 6. ROOM ITEMS TABLE
-- Detailed checklist items per room from research notes
-- -----------------------------------------------------------------------------
create table if not exists public.room_items (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    name text not null,
    condition text not null default 'clean_functional' check (condition in ('clean_functional', 'minor_wear', 'damaged', 'not_working', 'not_applicable')),
    notes text default '',
    item_order integer not null default 0,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 7. PHOTOS TABLE
-- Holds storage path, server-computed SHA-256 hash, and server timestamp
-- -----------------------------------------------------------------------------
create table if not exists public.photos (
    id uuid default gen_random_uuid() primary key,
    inspection_id uuid references public.inspections(id) on delete cascade not null,
    room_id uuid references public.rooms(id) on delete cascade,
    item_id uuid references public.room_items(id) on delete cascade,
    storage_path text not null,
    file_name text not null,
    file_size integer not null,
    mime_type text not null,
    sha256_hash text not null,
    uploaded_by uuid references public.profiles(id) not null,
    created_at timestamptz not null default timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 8. APPROVALS TABLE
-- Tracks approval decisions from tenant and landlord
-- -----------------------------------------------------------------------------
create table if not exists public.approvals (
    id uuid default gen_random_uuid() primary key,
    inspection_id uuid references public.inspections(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    role text not null check (role in ('tenant', 'landlord')),
    decision text not null check (decision in ('approved', 'rejected')),
    comments text,
    created_at timestamptz not null default timezone('utc', now()),
    constraint uq_inspection_user_approval unique (inspection_id, user_id)
);

-- -----------------------------------------------------------------------------
-- 9. AMENDMENTS TABLE
-- Append-only chain for post-lock changes. Never mutates the locked record.
-- -----------------------------------------------------------------------------
create table if not exists public.amendments (
    id uuid default gen_random_uuid() primary key,
    inspection_id uuid references public.inspections(id) on delete cascade not null,
    author_id uuid references public.profiles(id) not null,
    author_role text not null check (author_role in ('tenant', 'landlord')),
    reason text not null,
    changed_fields jsonb not null,
    prev_hash text not null,
    amendment_hash text not null,
    acknowledged_by uuid references public.profiles(id),
    acknowledged_at timestamptz,
    created_at timestamptz not null default timezone('utc', now())
);

-- -----------------------------------------------------------------------------
-- 10. SETTLEMENTS TABLE (Created in Run 1 schema, populated in Run 2)
-- -----------------------------------------------------------------------------
create table if not exists public.settlements (
    id uuid default gen_random_uuid() primary key,
    property_id uuid references public.properties(id) on delete cascade not null,
    move_in_inspection_id uuid references public.inspections(id) not null,
    move_out_inspection_id uuid references public.inspections(id),
    original_deposit numeric(12, 2) not null default 0,
    proposed_deductions jsonb not null default '[]'::jsonb,
    total_deductions numeric(12, 2) not null default 0,
    refund_amount numeric(12, 2) not null default 0,
    status text not null default 'draft' check (status in ('draft', 'agreed', 'disputed')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- =============================================================================
-- IMMUTABILITY TRIGGERS
-- DB triggers reject UPDATE/DELETE on locked inspections and their rooms/items/photos.
-- Any edit while pending_approval resets approvals back to draft.
-- =============================================================================

-- 1. Inspection Immutability & Edit Reset Trigger
create or replace function public.trig_inspection_lock_guard()
returns trigger as $$
begin
    if TG_OP = 'DELETE' then
        if OLD.status = 'locked' then
            raise exception 'Cannot delete a locked inspection. DepositGuard records are tamper-evident and immutable.';
        end if;
        return OLD;
    end if;

    if TG_OP = 'UPDATE' then
        -- If already locked, prevent mutating core fields
        if OLD.status = 'locked' then
            -- Disallow any alteration of a locked record
            raise exception 'Locked inspection is immutable. Any post-lock changes must be recorded as append-only amendments.';
        end if;

        -- If pending_approval and core content changes (other than status change), reset approvals to draft
        if OLD.status = 'pending_approval' and NEW.status = 'pending_approval' then
            if (OLD.type is distinct from NEW.type) or (OLD.schema_version is distinct from NEW.schema_version) then
                NEW.status := 'draft';
                delete from public.approvals where inspection_id = NEW.id;
            end if;
        end if;

        NEW.updated_at := timezone('utc', now());
        return NEW;
    end if;

    return NEW;
end;
$$ language plpgsql;

drop trigger if exists tr_inspection_lock_guard on public.inspections;
create trigger tr_inspection_lock_guard
    before update or delete on public.inspections
    for each row execute function public.trig_inspection_lock_guard();

-- 2. Child Items (rooms, room_items, photos) Immutability & Reset Trigger
create or replace function public.trig_child_lock_guard()
returns trigger as $$
declare
    v_inspection_id uuid;
    v_status text;
begin
    if TG_TABLE_NAME = 'rooms' then
        v_inspection_id := coalesce(OLD.inspection_id, NEW.inspection_id);
    elsif TG_TABLE_NAME = 'room_items' then
        select inspection_id into v_inspection_id from public.rooms where id = coalesce(OLD.room_id, NEW.room_id);
    elsif TG_TABLE_NAME = 'photos' then
        v_inspection_id := coalesce(OLD.inspection_id, NEW.inspection_id);
    end if;

    select status into v_status from public.inspections where id = v_inspection_id;

    if v_status = 'locked' then
        raise exception 'Operation rejected: Table % cannot be modified or deleted because inspection % is locked.', TG_TABLE_NAME, v_inspection_id;
    end if;

    -- If currently pending approval, any child change invalidates pending approvals and resets status to draft
    if v_status = 'pending_approval' then
        update public.inspections set status = 'draft', updated_at = timezone('utc', now()) where id = v_inspection_id;
        delete from public.approvals where inspection_id = v_inspection_id;
    end if;

    if TG_OP = 'DELETE' then
        return OLD;
    else
        return NEW;
    end if;
end;
$$ language plpgsql;

drop trigger if exists tr_rooms_lock_guard on public.rooms;
create trigger tr_rooms_lock_guard
    before insert or update or delete on public.rooms
    for each row execute function public.trig_child_lock_guard();

drop trigger if exists tr_room_items_lock_guard on public.room_items;
create trigger tr_room_items_lock_guard
    before insert or update or delete on public.room_items
    for each row execute function public.trig_child_lock_guard();

drop trigger if exists tr_photos_lock_guard on public.photos;
create trigger tr_photos_lock_guard
    before insert or update or delete on public.photos
    for each row execute function public.trig_child_lock_guard();

-- =============================================================================
-- DUAL-CONFIRMATION LOCK TRANSACTION / RPC
-- Runs on second approval inside a single transaction with row lock.
-- =============================================================================
create or replace function public.lock_inspection_rpc(
    p_inspection_id uuid,
    p_canonical_hash text
)
returns jsonb as $$
declare
    v_inspection record;
    v_approvals_count integer;
    v_tenant_approved boolean := false;
    v_landlord_approved boolean := false;
    v_locked_time timestamptz;
begin
    -- 1. Row-level lock on inspection to serialize concurrent approvals
    select * into v_inspection
    from public.inspections
    where id = p_inspection_id
    for update;

    if not found then
        raise exception 'Inspection % not found', p_inspection_id;
    end if;

    if v_inspection.status = 'locked' then
        return jsonb_build_object(
            'success', true,
            'status', 'locked',
            'locked_hash', v_inspection.locked_hash,
            'locked_at', v_inspection.locked_at,
            'message', 'Inspection is already locked.'
        );
    end if;

    -- 2. Check approvals: both tenant and landlord must have approved
    select count(*) into v_approvals_count
    from public.approvals
    where inspection_id = p_inspection_id and decision = 'approved';

    select exists(
        select 1 from public.approvals
        where inspection_id = p_inspection_id and role = 'tenant' and decision = 'approved'
    ) into v_tenant_approved;

    select exists(
        select 1 from public.approvals
        where inspection_id = p_inspection_id and role = 'landlord' and decision = 'approved'
    ) into v_landlord_approved;

    if not (v_tenant_approved and v_landlord_approved) then
        return jsonb_build_object(
            'success', false,
            'status', v_inspection.status,
            'message', 'Cannot lock: Both Tenant and Landlord approvals are required.'
        );
    end if;

    -- 3. Transition to locked status with canonical SHA-256 hash
    v_locked_time := timezone('utc', now());

    update public.inspections
    set
        status = 'locked',
        locked_hash = p_canonical_hash,
        locked_at = v_locked_time,
        updated_at = v_locked_time
    where id = p_inspection_id;

    return jsonb_build_object(
        'success', true,
        'status', 'locked',
        'locked_hash', p_canonical_hash,
        'locked_at', v_locked_time,
        'message', 'Dual-confirmation lock successfully engaged.'
    );
end;
$$ language plpgsql security definer;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_members enable row level security;
alter table public.inspections enable row level security;
alter table public.rooms enable row level security;
alter table public.room_items enable row level security;
alter table public.photos enable row level security;
alter table public.approvals enable row level security;
alter table public.amendments enable row level security;
alter table public.settlements enable row level security;

-- PROFILES
create policy "Users can view own profile" on public.profiles
    for select using (auth.uid() = id);

create policy "Users can view profiles in same properties" on public.profiles
    for select using (
        exists (
            select 1 from public.property_members pm1
            join public.property_members pm2 on pm1.property_id = pm2.property_id
            where pm1.user_id = auth.uid() and pm2.user_id = profiles.id
        )
    );

create policy "Users can update own profile" on public.profiles
    for update using (auth.uid() = id);

-- PROPERTIES
create policy "Property members can view property" on public.properties
    for select using (
        landlord_id = auth.uid() or
        exists (select 1 from public.property_members where property_id = properties.id and user_id = auth.uid())
    );

create policy "Landlords can insert properties" on public.properties
    for insert with check (
        landlord_id = auth.uid()
    );

create policy "Landlords can update own property" on public.properties
    for update using (landlord_id = auth.uid());

-- PROPERTY MEMBERS
create policy "Members can view co-members" on public.property_members
    for select using (
        user_id = auth.uid() or
        exists (select 1 from public.property_members pm where pm.property_id = property_members.property_id and pm.user_id = auth.uid())
    );

create policy "Users can join via invite" on public.property_members
    for insert with check (
        user_id = auth.uid()
    );

-- INSPECTIONS
create policy "Members can view inspections" on public.inspections
    for select using (
        exists (select 1 from public.property_members where property_id = inspections.property_id and user_id = auth.uid())
    );

create policy "Members can create inspections" on public.inspections
    for insert with check (
        exists (select 1 from public.property_members where property_id = inspections.property_id and user_id = auth.uid())
    );

create policy "Members can update draft inspections" on public.inspections
    for update using (
        status <> 'locked' and
        exists (select 1 from public.property_members where property_id = inspections.property_id and user_id = auth.uid())
    );

-- ROOMS & ITEMS & PHOTOS
create policy "Members can view rooms" on public.rooms
    for select using (
        exists (select 1 from public.inspections i
                join public.property_members pm on pm.property_id = i.property_id
                where i.id = rooms.inspection_id and pm.user_id = auth.uid())
    );

create policy "Members can modify rooms in unlocked inspections" on public.rooms
    for all using (
        exists (select 1 from public.inspections i
                join public.property_members pm on pm.property_id = i.property_id
                where i.id = rooms.inspection_id and pm.user_id = auth.uid() and i.status <> 'locked')
    );

create policy "Members can view room items" on public.room_items
    for select using (
        exists (select 1 from public.rooms r
                join public.inspections i on i.id = r.inspection_id
                join public.property_members pm on pm.property_id = i.property_id
                where r.id = room_items.room_id and pm.user_id = auth.uid())
    );

create policy "Members can modify room items in unlocked inspections" on public.room_items
    for all using (
        exists (select 1 from public.rooms r
                join public.inspections i on i.id = r.inspection_id
                join public.property_members pm on pm.property_id = i.property_id
                where r.id = room_items.room_id and pm.user_id = auth.uid() and i.status <> 'locked')
    );

create policy "Members can view photos" on public.photos
    for select using (
        exists (select 1 from public.inspections i
                join public.property_members pm on pm.property_id = i.property_id
                where i.id = photos.inspection_id and pm.user_id = auth.uid())
    );

create policy "Members can insert photos into unlocked inspections" on public.photos
    for insert with check (
        uploaded_by = auth.uid() and
        exists (select 1 from public.inspections i
                join public.property_members pm on pm.property_id = i.property_id
                where i.id = photos.inspection_id and pm.user_id = auth.uid() and i.status <> 'locked')
    );

-- APPROVALS
create policy "Members can view approvals" on public.approvals
    for select using (
        exists (select 1 from public.inspections i
                join public.property_members pm on pm.property_id = i.property_id
                where i.id = approvals.inspection_id and pm.user_id = auth.uid())
    );

create policy "Members can submit approvals" on public.approvals
    for insert with check (
        user_id = auth.uid() and
        exists (select 1 from public.inspections i
                join public.property_members pm on pm.property_id = i.property_id
                where i.id = approvals.inspection_id and pm.user_id = auth.uid())
    );

-- AMENDMENTS
create policy "Members can view amendments" on public.amendments
    for select using (
        exists (select 1 from public.inspections i
                join public.property_members pm on pm.property_id = i.property_id
                where i.id = amendments.inspection_id and pm.user_id = auth.uid())
    );

create policy "Members can create amendments for locked inspections" on public.amendments
    for insert with check (
        author_id = auth.uid() and
        exists (select 1 from public.inspections i
                join public.property_members pm on pm.property_id = i.property_id
                where i.id = amendments.inspection_id and pm.user_id = auth.uid() and i.status = 'locked')
    );

create policy "Members can acknowledge amendments" on public.amendments
    for update using (
        author_id <> auth.uid() and
        exists (select 1 from public.inspections i
                join public.property_members pm on pm.property_id = i.property_id
                where i.id = amendments.inspection_id and pm.user_id = auth.uid())
    );

-- SETTLEMENTS
create policy "Members can view settlements" on public.settlements
    for select using (
        exists (select 1 from public.property_members where property_id = settlements.property_id and user_id = auth.uid())
    );

create policy "Members can manage settlements" on public.settlements
    for all using (
        exists (select 1 from public.property_members where property_id = settlements.property_id and user_id = auth.uid())
    );
