-- =============================================================================
-- DepositGuard: Run 2 Database Migration
-- Adds AI Advisory Comparisons table and ensures Settlements compatibility
-- Advisory only, labeled "AI suggestion", stored separately, never part of locked hash.
-- =============================================================================

create table if not exists public.ai_comparisons (
    id uuid default gen_random_uuid() primary key,
    inspection_id uuid references public.inspections(id) on delete cascade not null,
    move_in_item_id uuid references public.room_items(id) on delete set null,
    move_out_item_id uuid references public.room_items(id) on delete set null,
    item_name text not null,
    room_name text not null,
    change_type text not null check (change_type in ('none', 'normal_wear', 'possible_damage', 'unclear')),
    confidence numeric(4, 3) not null default 0.0,
    rationale text not null default '',
    ai_status text not null default 'success' check (ai_status in ('success', 'failed')),
    model_used text not null default 'gemini-3.8-flash',
    created_at timestamptz not null default timezone('utc', now())
);

-- RLS for AI Comparisons (Property members can view)
alter table public.ai_comparisons enable row level security;

create policy "Members can view ai comparisons" on public.ai_comparisons
    for select using (
        exists (
            select 1 from public.inspections i
            join public.property_members pm on pm.property_id = i.property_id
            where i.id = ai_comparisons.inspection_id and pm.user_id = auth.uid()
        )
    );

create policy "Backend can insert ai comparisons" on public.ai_comparisons
    for insert with check (
        exists (
            select 1 from public.inspections i
            join public.property_members pm on pm.property_id = i.property_id
            where i.id = ai_comparisons.inspection_id and pm.user_id = auth.uid()
        )
    );
