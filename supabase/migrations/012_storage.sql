insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy documents_bucket_select_same_org
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and split_part(name, '/', 2)::uuid = public.current_org_id()
);

create policy documents_bucket_insert_same_org
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and split_part(name, '/', 2)::uuid = public.current_org_id()
);

create policy documents_bucket_update_same_org
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and split_part(name, '/', 2)::uuid = public.current_org_id()
)
with check (
  bucket_id = 'documents'
  and split_part(name, '/', 2)::uuid = public.current_org_id()
);

create policy documents_bucket_delete_same_org
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and split_part(name, '/', 2)::uuid = public.current_org_id()
  and public.is_company_admin()
);
