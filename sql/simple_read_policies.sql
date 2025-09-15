-- Autorise la lecture à tous les utilisateurs authentifiés sur les tables principales
CREATE POLICY clients_select_all_authenticated ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY companies_select_all_authenticated ON public.companies FOR SELECT TO authenticated USING (true);
CREATE POLICY contracts_select_all_authenticated ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY timesheets_select_all_authenticated ON public.timesheets FOR SELECT TO authenticated USING (true);
CREATE POLICY invoices_select_all_authenticated ON public.invoices FOR SELECT TO authenticated USING (true);
