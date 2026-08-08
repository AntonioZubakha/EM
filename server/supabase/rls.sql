-- ═══════════════════════════════════════════════════════════════
-- Row Level Security для elena-manicure
-- Запустите в Supabase → SQL Editor (можно повторно — идемпотентно)
-- ═══════════════════════════════════════════════════════════════
--
-- Архитектура:
--   • Фронтенд ходит только в Express API
--   • Бэкенд использует service_role → обходит RLS автоматически
--   • anon/authenticated через PostgREST — доступ закрыт (нет policies)
--
-- ⚠️  В GitHub Secrets и на бэкенде должен быть service_role key, не anon!

-- ── booked_slots ───────────────────────────────────────────────
ALTER TABLE public.booked_slots ENABLE ROW LEVEL SECURITY;

-- Удаляем старые policies, если перезапускаете скрипт
DROP POLICY IF EXISTS "booked_slots_service_role_all" ON public.booked_slots;
DROP POLICY IF EXISTS "booked_slots_anon_select" ON public.booked_slots;
DROP POLICY IF EXISTS "booked_slots_public_read" ON public.booked_slots;

-- Явная policy только для service_role (документация; ключ и так обходит RLS)
CREATE POLICY "booked_slots_service_role_all"
  ON public.booked_slots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── working_days ───────────────────────────────────────────────
ALTER TABLE public.working_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "working_days_service_role_all" ON public.working_days;
DROP POLICY IF EXISTS "working_days_anon_select" ON public.working_days;
DROP POLICY IF EXISTS "working_days_public_read" ON public.working_days;

CREATE POLICY "working_days_service_role_all"
  ON public.working_days
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Keep-alive через RPC (опционально, если нужен anon в cron) ─
-- По умолчанию keepalive.yml использует service_role и SELECT id.
-- Эта функция — запасной вариант без чтения таблицы напрямую anon-ключом.

CREATE OR REPLACE FUNCTION public.keepalive_ping()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM public.booked_slots;
$$;

REVOKE ALL ON FUNCTION public.keepalive_ping() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.keepalive_ping() TO service_role;
