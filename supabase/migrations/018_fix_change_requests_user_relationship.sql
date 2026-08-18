-- Fix PostgREST relationship for change_requests.user_id -> public.users.id
ALTER TABLE public.change_requests
  DROP CONSTRAINT IF EXISTS change_requests_user_id_fkey;

ALTER TABLE public.change_requests
  ADD CONSTRAINT change_requests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
