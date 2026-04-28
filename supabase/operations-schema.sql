create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists role text not null default 'admin',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists is_active boolean not null default false,
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists employee_id text;

create or replace function public.organization_id_for_user(user_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id from public.profiles where id = user_id
$$;

create or replace function public.user_is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and organization_id = org_id
  )
$$;

create or replace function public.user_is_org_admin(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and organization_id = org_id
      and role = 'admin'
  )
$$;

create or replace function public.user_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
$$;

create or replace function public.user_employee_id()
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  employee_uuid uuid;
begin
  select employee_id::uuid
  into employee_uuid
  from public.profiles
  where id = auth.uid()
    and employee_id is not null
    and employee_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  return employee_uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.ensure_profile_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org_id uuid;
begin
  if new.organization_id is not null then
    return new;
  end if;

  insert into public.organizations (name, owner_id)
  values (coalesce(new.full_name, split_part(new.email, '@', 1), 'StackLess') || '''s organization', new.id)
  returning id into new_org_id;

  new.organization_id = new_org_id;
  return new;
end;
$$;

drop trigger if exists ensure_profiles_organization on public.profiles;
create trigger ensure_profiles_organization
before insert on public.profiles
for each row
execute function public.ensure_profile_organization();

update public.profiles p
set organization_id = o.id
from public.organizations o
where p.organization_id is null
  and o.owner_id = p.id;

insert into public.organizations (name, owner_id)
select coalesce(full_name, split_part(email, '@', 1), 'StackLess') || '''s organization', id
from public.profiles
where organization_id is null
  and not exists (
    select 1
    from public.organizations existing
    where existing.owner_id = public.profiles.id
  );

update public.profiles p
set organization_id = o.id
from public.organizations o
where p.organization_id is null
  and o.owner_id = p.id;

alter table public.organizations enable row level security;

drop policy if exists "Organization members can read organization" on public.organizations;
create policy "Organization members can read organization"
on public.organizations
for select
to authenticated
using (public.user_is_org_member(id));

drop policy if exists "Organization owners can update organization" on public.organizations;
create policy "Organization owners can update organization"
on public.organizations
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  email text not null default '',
  role text not null default '',
  availability text not null default '',
  status text not null default 'active',
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employees
  add column if not exists email text not null default '';

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  title text not null,
  customer_name text not null default '',
  service_type text not null default '',
  address text not null default '',
  job_value numeric(12,2),
  date date not null,
  start_time text not null default '',
  end_time text not null default '',
  status text not null default 'unassigned',
  notes text not null default '',
  requires_photos boolean not null default true,
  work_started_at timestamptz,
  work_completed_at timestamptz,
  verification_feedback text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.jobs
  add column if not exists job_value numeric(12,2);

alter table public.jobs
  add column if not exists verification_feedback text not null default '';

alter table public.jobs
  add column if not exists requires_photos boolean not null default true;

create table if not exists public.job_assignees (
  job_id uuid not null references public.jobs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (job_id, employee_id)
);

create table if not exists public.job_tasks (
  id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  title text not null,
  description text not null default '',
  is_completed boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_checklist_items (
  id text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  order_index integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (job_id, id)
);

create table if not exists public.task_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id text not null references public.job_tasks(id) on delete cascade,
  image_url text not null,
  storage_path text,
  label text not null default 'reference',
  note text not null default '',
  uploaded_by_id uuid references auth.users(id) on delete set null,
  uploaded_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists public.employee_day_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null,
  status text not null default 'working',
  start_time text,
  end_time text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (employee_id, date)
);

create table if not exists public.employee_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  token text not null unique,
  contact_email text,
  contact_phone text,
  status text not null default 'pending',
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz,
  email_sent_at timestamptz,
  email_send_error text,
  sms_sent_at timestamptz,
  sms_send_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_organization_id_idx on public.customers (organization_id);
create index if not exists employees_organization_id_idx on public.employees (organization_id);
create index if not exists jobs_organization_id_date_idx on public.jobs (organization_id, date);
create index if not exists job_assignees_organization_id_idx on public.job_assignees (organization_id);
create index if not exists job_tasks_job_id_idx on public.job_tasks (job_id);
create index if not exists job_checklist_items_job_id_idx on public.job_checklist_items (job_id);
create index if not exists task_photos_task_id_idx on public.task_photos (task_id);
create index if not exists employee_day_schedules_employee_date_idx on public.employee_day_schedules (employee_id, date);
create index if not exists employee_invites_organization_id_idx on public.employee_invites (organization_id);
create index if not exists employee_invites_employee_id_idx on public.employee_invites (employee_id);
create index if not exists employee_invites_token_idx on public.employee_invites (token);

create or replace function public.user_is_assigned_to_job(target_job_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.job_assignees ja
    join public.jobs j on j.id = ja.job_id and j.organization_id = ja.organization_id
    join public.profiles p on p.id = auth.uid()
    where ja.job_id = target_job_id
      and p.organization_id = ja.organization_id
      and p.employee_id = ja.employee_id::text
  )
$$;

create or replace function public.user_can_access_customer(target_customer_id uuid, org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.user_is_org_admin(org_id)
    or exists (
      select 1
      from public.jobs j
      where j.customer_id = target_customer_id
        and j.organization_id = org_id
        and public.user_is_assigned_to_job(j.id)
    )
$$;

create or replace function public.user_can_access_employee(target_employee_id uuid, org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.user_is_org_admin(org_id)
    or (
      target_employee_id = public.user_employee_id()
      and public.user_is_org_member(org_id)
    )
    or exists (
      select 1
      from public.job_assignees mine
      join public.job_assignees teammate on teammate.job_id = mine.job_id
      where mine.organization_id = org_id
        and teammate.organization_id = org_id
        and mine.employee_id = public.user_employee_id()
        and teammate.employee_id = target_employee_id
    )
$$;

create or replace function public.user_can_access_job_task(target_task_id text, org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.user_is_org_admin(org_id)
    or exists (
      select 1
      from public.job_tasks jt
      where jt.id = target_task_id
        and jt.organization_id = org_id
        and public.user_is_assigned_to_job(jt.job_id)
    )
$$;

create or replace function public.user_can_access_job_checklist(target_job_id uuid, org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.user_is_org_admin(org_id)
    or public.user_is_assigned_to_job(target_job_id)
$$;

create or replace function public.employee_job_update_is_work_state_only(
  target_job_id uuid,
  target_organization_id uuid,
  target_customer_id uuid,
  target_title text,
  target_customer_name text,
  target_service_type text,
  target_address text,
  target_job_value numeric,
  target_date date,
  target_start_time text,
  target_end_time text,
  target_notes text,
  target_requires_photos boolean
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = target_job_id
      and j.organization_id = target_organization_id
      and j.customer_id is not distinct from target_customer_id
      and j.title is not distinct from target_title
      and j.customer_name is not distinct from target_customer_name
      and j.service_type is not distinct from target_service_type
      and j.address is not distinct from target_address
      and j.job_value is not distinct from target_job_value
      and j.date is not distinct from target_date
      and j.start_time is not distinct from target_start_time
      and j.end_time is not distinct from target_end_time
      and j.notes is not distinct from target_notes
      and j.requires_photos is not distinct from target_requires_photos
  )
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at before update on public.customers for each row execute function public.set_updated_at();
drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at before update on public.employees for each row execute function public.set_updated_at();
drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
drop trigger if exists set_job_tasks_updated_at on public.job_tasks;
create trigger set_job_tasks_updated_at before update on public.job_tasks for each row execute function public.set_updated_at();
drop trigger if exists set_job_checklist_items_updated_at on public.job_checklist_items;
create trigger set_job_checklist_items_updated_at before update on public.job_checklist_items for each row execute function public.set_updated_at();
drop trigger if exists set_employee_day_schedules_updated_at on public.employee_day_schedules;
create trigger set_employee_day_schedules_updated_at before update on public.employee_day_schedules for each row execute function public.set_updated_at();
drop trigger if exists set_employee_invites_updated_at on public.employee_invites;
create trigger set_employee_invites_updated_at before update on public.employee_invites for each row execute function public.set_updated_at();

alter table public.customers enable row level security;
alter table public.employees enable row level security;
alter table public.jobs enable row level security;
alter table public.job_assignees enable row level security;
alter table public.job_tasks enable row level security;
alter table public.job_checklist_items enable row level security;
alter table public.task_photos enable row level security;
alter table public.employee_day_schedules enable row level security;
alter table public.employee_invites enable row level security;

drop policy if exists "Org members can read customers" on public.customers;
drop policy if exists "Org members can write customers" on public.customers;
drop policy if exists "Admins can read customers" on public.customers;
create policy "Admins can read customers" on public.customers for select to authenticated using (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can read assigned job customers" on public.customers;
create policy "Employees can read assigned job customers" on public.customers for select to authenticated using (public.user_can_access_customer(id, organization_id));
drop policy if exists "Admins can write customers" on public.customers;
create policy "Admins can write customers" on public.customers for all to authenticated using (public.user_is_org_admin(organization_id)) with check (public.user_is_org_admin(organization_id));

drop policy if exists "Org members can read employees" on public.employees;
drop policy if exists "Org members can write employees" on public.employees;
drop policy if exists "Admins can read employees" on public.employees;
create policy "Admins can read employees" on public.employees for select to authenticated using (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can read scoped employees" on public.employees;
create policy "Employees can read scoped employees" on public.employees for select to authenticated using (public.user_can_access_employee(id, organization_id));
drop policy if exists "Admins can write employees" on public.employees;
create policy "Admins can write employees" on public.employees for all to authenticated using (public.user_is_org_admin(organization_id)) with check (public.user_is_org_admin(organization_id));

drop policy if exists "Org members can read jobs" on public.jobs;
drop policy if exists "Org members can write jobs" on public.jobs;
drop policy if exists "Admins can read jobs" on public.jobs;
create policy "Admins can read jobs" on public.jobs for select to authenticated using (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can read assigned jobs" on public.jobs;
create policy "Employees can read assigned jobs" on public.jobs for select to authenticated using (public.user_is_assigned_to_job(id));
drop policy if exists "Admins can write jobs" on public.jobs;
create policy "Admins can write jobs" on public.jobs for all to authenticated using (public.user_is_org_admin(organization_id)) with check (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can update assigned job work state" on public.jobs;
create policy "Employees can update assigned job work state" on public.jobs for update to authenticated using (public.user_is_assigned_to_job(id)) with check (public.user_is_assigned_to_job(id) and public.employee_job_update_is_work_state_only(id, organization_id, customer_id, title, customer_name, service_type, address, job_value, date, start_time, end_time, notes, requires_photos));

drop policy if exists "Org members can read job assignees" on public.job_assignees;
drop policy if exists "Org members can write job assignees" on public.job_assignees;
drop policy if exists "Admins can read job assignees" on public.job_assignees;
create policy "Admins can read job assignees" on public.job_assignees for select to authenticated using (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can read assigned job assignees" on public.job_assignees;
create policy "Employees can read assigned job assignees" on public.job_assignees for select to authenticated using (public.user_is_assigned_to_job(job_id));
drop policy if exists "Admins can write job assignees" on public.job_assignees;
create policy "Admins can write job assignees" on public.job_assignees for all to authenticated using (public.user_is_org_admin(organization_id)) with check (public.user_is_org_admin(organization_id));

drop policy if exists "Org members can read job tasks" on public.job_tasks;
drop policy if exists "Org members can write job tasks" on public.job_tasks;
drop policy if exists "Admins can read job tasks" on public.job_tasks;
create policy "Admins can read job tasks" on public.job_tasks for select to authenticated using (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can read assigned job tasks" on public.job_tasks;
create policy "Employees can read assigned job tasks" on public.job_tasks for select to authenticated using (public.user_is_assigned_to_job(job_id));
drop policy if exists "Admins can write job tasks" on public.job_tasks;
create policy "Admins can write job tasks" on public.job_tasks for all to authenticated using (public.user_is_org_admin(organization_id)) with check (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can update assigned job tasks" on public.job_tasks;
create policy "Employees can update assigned job tasks" on public.job_tasks for update to authenticated using (public.user_is_assigned_to_job(job_id)) with check (public.user_is_assigned_to_job(job_id));

drop policy if exists "Org members can read checklist items" on public.job_checklist_items;
drop policy if exists "Org members can write checklist items" on public.job_checklist_items;
drop policy if exists "Admins can read checklist items" on public.job_checklist_items;
create policy "Admins can read checklist items" on public.job_checklist_items for select to authenticated using (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can read assigned job checklist items" on public.job_checklist_items;
create policy "Employees can read assigned job checklist items" on public.job_checklist_items for select to authenticated using (public.user_is_assigned_to_job(job_id));
drop policy if exists "Admins can write checklist items" on public.job_checklist_items;
create policy "Admins can write checklist items" on public.job_checklist_items for all to authenticated using (public.user_is_org_admin(organization_id)) with check (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can update assigned job checklist items" on public.job_checklist_items;
create policy "Employees can update assigned job checklist items" on public.job_checklist_items for update to authenticated using (public.user_is_assigned_to_job(job_id)) with check (public.user_is_assigned_to_job(job_id));

drop policy if exists "Org members can read task photos" on public.task_photos;
drop policy if exists "Org members can write task photos" on public.task_photos;
drop policy if exists "Admins can read task photos" on public.task_photos;
create policy "Admins can read task photos" on public.task_photos for select to authenticated using (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can read own task photos" on public.task_photos;
drop policy if exists "Employees can read assigned job task photos" on public.task_photos;
create policy "Employees can read assigned job task photos" on public.task_photos for select to authenticated using (public.user_can_access_job_task(task_id, organization_id));
drop policy if exists "Admins can write task photos" on public.task_photos;
create policy "Admins can write task photos" on public.task_photos for all to authenticated using (public.user_is_org_admin(organization_id)) with check (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can insert own assigned job task photos" on public.task_photos;
create policy "Employees can insert own assigned job task photos" on public.task_photos for insert to authenticated with check (uploaded_by_id = auth.uid() and public.user_can_access_job_task(task_id, organization_id));
drop policy if exists "Employees can update own task photos" on public.task_photos;
create policy "Employees can update own task photos" on public.task_photos for update to authenticated using (uploaded_by_id = auth.uid()) with check (uploaded_by_id = auth.uid() and public.user_can_access_job_task(task_id, organization_id));
drop policy if exists "Employees can delete own task photos" on public.task_photos;
create policy "Employees can delete own task photos" on public.task_photos for delete to authenticated using (uploaded_by_id = auth.uid() and public.user_can_access_job_task(task_id, organization_id));

drop policy if exists "Org members can read employee day schedules" on public.employee_day_schedules;
drop policy if exists "Org members can write employee day schedules" on public.employee_day_schedules;
drop policy if exists "Admins can read employee day schedules" on public.employee_day_schedules;
create policy "Admins can read employee day schedules" on public.employee_day_schedules for select to authenticated using (public.user_is_org_admin(organization_id));
drop policy if exists "Employees can read own day schedules" on public.employee_day_schedules;
create policy "Employees can read own day schedules" on public.employee_day_schedules for select to authenticated using (employee_id = public.user_employee_id());
drop policy if exists "Admins can write employee day schedules" on public.employee_day_schedules;
create policy "Admins can write employee day schedules" on public.employee_day_schedules for all to authenticated using (public.user_is_org_admin(organization_id)) with check (public.user_is_org_admin(organization_id));

drop policy if exists "Org members can read employee invites" on public.employee_invites;
drop policy if exists "Org members can write employee invites" on public.employee_invites;
drop policy if exists "Org admins can write employee invites" on public.employee_invites;
drop policy if exists "Org members can update employee invites" on public.employee_invites;
drop policy if exists "Org admins can update employee invites" on public.employee_invites;
drop policy if exists "Admins can read employee invites" on public.employee_invites;
create policy "Admins can read employee invites" on public.employee_invites for select to authenticated using (public.user_is_org_admin(organization_id));
drop policy if exists "Admins can insert employee invites" on public.employee_invites;
create policy "Admins can insert employee invites" on public.employee_invites for insert to authenticated with check (public.user_is_org_admin(organization_id));
drop policy if exists "Admins can update employee invites" on public.employee_invites;
create policy "Admins can update employee invites" on public.employee_invites for update to authenticated using (public.user_is_org_admin(organization_id)) with check (public.user_is_org_admin(organization_id));

create or replace function public.accept_employee_invite(invite_token text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_row public.employee_invites%rowtype;
  profile_row public.profiles%rowtype;
  auth_email text;
  employee_row public.employees%rowtype;
  expected_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated.';
  end if;

  select lower(trim(coalesce(email::text, '')))
  into auth_email
  from auth.users
  where id = auth.uid();

  if auth_email is null or auth_email = '' then
    raise exception 'Your account does not have an email address; crew invites require email sign-in.';
  end if;

  select *
  into invite_row
  from public.employee_invites
  where token = invite_token
    and status = 'pending'
    and (expires_at is null or expires_at > now())
  for update;

  if invite_row.id is null then
    raise exception 'Invite is invalid, expired, or already used.';
  end if;

  select * into employee_row from public.employees where id = invite_row.employee_id;

  expected_email := lower(trim(coalesce(
    nullif(invite_row.contact_email, ''),
    nullif(employee_row.email, '')
  )));

  if expected_email is null or expected_email = '' then
    raise exception 'This invite has no email on file. Ask your admin to add an email on the employee record or regenerate the invite with an email.';
  end if;

  if auth_email <> expected_email then
    raise exception 'Sign in with the same email address that received this crew invite.';
  end if;

  select * into profile_row from public.profiles where id = auth.uid();

  if profile_row.id is null then
    raise exception 'No profile found for invite acceptance.';
  end if;

  if profile_row.role = 'admin' and profile_row.organization_id is not null then
    raise exception 'This account already manages an organization and cannot accept a crew invite.';
  end if;

  if
    profile_row.role = 'employee'
    and profile_row.organization_id is not null
    and (
      profile_row.organization_id is distinct from invite_row.organization_id
      or profile_row.employee_id is distinct from invite_row.employee_id::text
    )
  then
    raise exception 'This account is already linked to a different crew profile.';
  end if;

  update public.profiles
  set
    organization_id = invite_row.organization_id,
    employee_id = invite_row.employee_id::text,
    role = 'employee',
    is_active = true,
    updated_at = now()
  where id = auth.uid()
  returning * into profile_row;

  if profile_row.id is null then
    raise exception 'No profile found for invite acceptance.';
  end if;

  update public.employee_invites
  set
    status = 'accepted',
    accepted_by = auth.uid(),
    accepted_at = now()
  where id = invite_row.id;

  return profile_row;
end;
$$;

create or replace function public.organization_has_subscription_access(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_org_id is not null
    and exists (
      select 1
      from public.profiles p
      where p.organization_id = target_org_id
        and p.role = 'admin'
        and p.is_active is true
        and coalesce(p.subscription_status, '') in ('active', 'trialing')
    );
$$;

create or replace function public.save_job_atomic(
  job_payload jsonb,
  assignee_ids uuid[],
  checklist_payload jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  v_org_id uuid := (job_payload->>'organization_id')::uuid;
  v_job_id uuid := (job_payload->>'id')::uuid;
  v_customer_id uuid := nullif(job_payload->>'customer_id', '')::uuid;
  normalized_assignee_ids uuid[] := coalesce(assignee_ids, '{}'::uuid[]);
  normalized_checklist jsonb := coalesce(checklist_payload, '[]'::jsonb);
begin
  if actor_id is null then
    return jsonb_build_object('success', false, 'error', 'User is not authenticated.');
  end if;

  if v_org_id is null or v_job_id is null then
    return jsonb_build_object('success', false, 'error', 'Job payload is missing required ids.');
  end if;

  if not public.user_is_org_admin(v_org_id) then
    return jsonb_build_object('success', false, 'error', 'Only organization admins can save jobs.');
  end if;

  if jsonb_typeof(normalized_checklist) <> 'array' then
    return jsonb_build_object('success', false, 'error', 'Checklist payload must be an array.');
  end if;

  if exists (
    select 1
    from unnest(normalized_assignee_ids) as assignee_id
    left join public.employees e on e.id = assignee_id
    where e.id is null or e.organization_id <> v_org_id
  ) then
    return jsonb_build_object('success', false, 'error', 'One or more assignees are invalid for this organization.');
  end if;

  if exists (
    select 1
    from jsonb_array_elements(normalized_checklist) as item
    where coalesce(item->>'id', '') = ''
  ) then
    return jsonb_build_object('success', false, 'error', 'Checklist items must include a valid id.');
  end if;

  if v_customer_id is not null then
    if not exists (
      select 1
      from public.customers c
      where c.id = v_customer_id
        and c.organization_id = v_org_id
    ) then
      return jsonb_build_object('success', false, 'error', 'Customer does not belong to this organization.');
    end if;
  end if;

  insert into public.jobs (
    id,
    organization_id,
    customer_id,
    title,
    customer_name,
    service_type,
    address,
    job_value,
    date,
    start_time,
    end_time,
    status,
    notes,
    requires_photos,
    work_started_at,
    work_completed_at,
    verification_feedback,
    created_by,
    updated_by
  )
  values (
    v_job_id,
    v_org_id,
    v_customer_id,
    coalesce(job_payload->>'title', ''),
    coalesce(job_payload->>'customer_name', ''),
    coalesce(job_payload->>'service_type', ''),
    coalesce(job_payload->>'address', ''),
    nullif(job_payload->>'job_value', '')::numeric(12, 2),
    nullif(job_payload->>'date', '')::date,
    coalesce(job_payload->>'start_time', ''),
    coalesce(job_payload->>'end_time', ''),
    coalesce(job_payload->>'status', 'unassigned'),
    coalesce(job_payload->>'notes', ''),
    coalesce((job_payload->>'requires_photos')::boolean, true),
    nullif(job_payload->>'work_started_at', '')::timestamptz,
    nullif(job_payload->>'work_completed_at', '')::timestamptz,
    coalesce(job_payload->>'verification_feedback', ''),
    actor_id,
    actor_id
  )
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    customer_id = excluded.customer_id,
    title = excluded.title,
    customer_name = excluded.customer_name,
    service_type = excluded.service_type,
    address = excluded.address,
    job_value = excluded.job_value,
    date = excluded.date,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    status = excluded.status,
    notes = excluded.notes,
    requires_photos = excluded.requires_photos,
    work_started_at = excluded.work_started_at,
    work_completed_at = excluded.work_completed_at,
    verification_feedback = excluded.verification_feedback,
    updated_by = excluded.updated_by,
    updated_at = now();

  insert into public.job_assignees (
    job_id,
    employee_id,
    organization_id,
    assigned_by
  )
  select
    v_job_id,
    assignee_id,
    v_org_id,
    actor_id
  from unnest(normalized_assignee_ids) as assignee_id
  on conflict (job_id, employee_id) do update
  set
    organization_id = excluded.organization_id,
    assigned_by = excluded.assigned_by;

  delete from public.job_assignees
  where job_id = v_job_id
    and organization_id = v_org_id
    and (
      cardinality(normalized_assignee_ids) = 0
      or employee_id <> all(normalized_assignee_ids)
    );

  insert into public.job_checklist_items (
    id,
    organization_id,
    job_id,
    title,
    is_completed,
    order_index,
    created_by,
    updated_by
  )
  select
    item->>'id',
    v_org_id,
    v_job_id,
    coalesce(item->>'title', ''),
    coalesce((item->>'is_completed')::boolean, false),
    coalesce((item->>'order_index')::integer, 0),
    actor_id,
    actor_id
  from jsonb_array_elements(normalized_checklist) as item
  on conflict (job_id, id) do update
  set
    title = excluded.title,
    is_completed = excluded.is_completed,
    order_index = excluded.order_index,
    updated_by = excluded.updated_by,
    updated_at = now();

  delete from public.job_checklist_items c
  where c.job_id = v_job_id
    and c.organization_id = v_org_id
    and (
      jsonb_array_length(normalized_checklist) = 0
      or not exists (
        select 1
        from jsonb_array_elements(normalized_checklist) as item
        where item->>'id' = c.id
      )
    );

  return jsonb_build_object('success', true);
exception
  when others then
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.accept_employee_invite(text) to authenticated;
grant execute on function public.organization_has_subscription_access(uuid) to authenticated;
grant execute on function public.save_job_atomic(jsonb, uuid[], jsonb) to authenticated;
grant execute on function public.organization_id_for_user(uuid) to authenticated;
grant execute on function public.user_is_org_member(uuid) to authenticated;
grant execute on function public.user_is_org_admin(uuid) to authenticated;
grant execute on function public.user_is_admin() to authenticated;
grant execute on function public.user_employee_id() to authenticated;
grant execute on function public.user_is_assigned_to_job(uuid) to authenticated;
grant execute on function public.user_can_access_customer(uuid, uuid) to authenticated;
grant execute on function public.user_can_access_employee(uuid, uuid) to authenticated;
grant execute on function public.user_can_access_job_task(text, uuid) to authenticated;
grant execute on function public.user_can_access_job_checklist(uuid, uuid) to authenticated;
grant execute on function public.employee_job_update_is_work_state_only(uuid, uuid, uuid, text, text, text, text, numeric, date, text, text, text, boolean) to authenticated;

grant select, insert, update, delete on
  public.customers,
  public.employees,
  public.jobs,
  public.job_assignees,
  public.job_tasks,
  public.job_checklist_items,
  public.task_photos,
  public.employee_day_schedules,
  public.employee_invites
to authenticated;

grant select on public.organizations to authenticated;
