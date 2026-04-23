create or replace function public.is_company_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select role in ('company_admin', 'platform_admin')
      from public.profiles
      where id = auth.uid()
      limit 1
    ),
    false
  );
$$;
