-- ============================================================
-- Ajuste temporal: permitir también al rol anon (sin login aún).
-- Revertir cuando se implemente autenticación (ver overview del
-- portal — "Habrá login/roles" quedó pendiente para v2).
-- ============================================================

drop policy if exists "authenticated_select" on infracciones_velocidad;
create policy "anon_authenticated_select"
  on infracciones_velocidad
  for select
  to anon, authenticated
  using (true);

drop policy if exists "authenticated_insert" on infracciones_velocidad;
create policy "anon_authenticated_insert"
  on infracciones_velocidad
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "authenticated_update" on infracciones_velocidad;
create policy "anon_authenticated_update"
  on infracciones_velocidad
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "authenticated_delete" on infracciones_velocidad;
create policy "anon_authenticated_delete"
  on infracciones_velocidad
  for delete
  to anon, authenticated
  using (true);
