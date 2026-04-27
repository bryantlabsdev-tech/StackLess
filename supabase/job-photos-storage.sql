insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-photos',
  'job-photos',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.job_photo_object_job_id(object_name text)
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  job_uuid uuid;
begin
  job_uuid := split_part(object_name, '/', 2)::uuid;
  return job_uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

create or replace function public.user_can_read_job_photo_object(object_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
      select 1
      from public.jobs j
      where j.id = public.job_photo_object_job_id(object_name)
        and (
          public.user_is_org_admin(j.organization_id)
          or public.user_is_assigned_to_job(j.id)
        )
    )
$$;

create or replace function public.user_can_write_job_photo_object(object_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.jobs j
    where j.id = public.job_photo_object_job_id(object_name)
      and (
        public.user_is_org_admin(j.organization_id)
        or (
          split_part(object_name, '/', 1) = auth.uid()::text
          and public.user_is_assigned_to_job(j.id)
        )
      )
  )
$$;

drop policy if exists "Users can read own job photos" on storage.objects;
drop policy if exists "Users can upload own job photos" on storage.objects;
drop policy if exists "Users can update own job photos" on storage.objects;
drop policy if exists "Users can delete own job photos" on storage.objects;
drop policy if exists "Users can read scoped job photos" on storage.objects;
create policy "Users can read scoped job photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'job-photos'
  and public.user_can_read_job_photo_object(name)
);

drop policy if exists "Users can upload scoped job photos" on storage.objects;
create policy "Users can upload scoped job photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'job-photos'
  and public.user_can_write_job_photo_object(name)
);

drop policy if exists "Users can update scoped job photos" on storage.objects;
create policy "Users can update scoped job photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'job-photos'
  and public.user_can_write_job_photo_object(name)
)
with check (
  bucket_id = 'job-photos'
  and public.user_can_write_job_photo_object(name)
);

drop policy if exists "Users can delete scoped job photos" on storage.objects;
create policy "Users can delete scoped job photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'job-photos'
  and public.user_can_write_job_photo_object(name)
);

grant execute on function public.job_photo_object_job_id(text) to authenticated;
grant execute on function public.user_can_read_job_photo_object(text) to authenticated;
grant execute on function public.user_can_write_job_photo_object(text) to authenticated;
