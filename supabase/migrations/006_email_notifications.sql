-- 006: Email delivery for in-portal notifications.
--
-- Every notification row is also emailed to its recipient. The app server
-- (service role) claims undelivered rows, sends them, and records the outcome
-- here. Idempotent: safe to run more than once.

alter table public.notifications add column if not exists emailed_at     timestamptz;
alter table public.notifications add column if not exists email_attempts int not null default 0;
alter table public.notifications add column if not exists email_error    text;

-- Rows created before email existed are treated as already handled
update public.notifications set emailed_at = created_at
where emailed_at is null and email_attempts = 0 and created_at < now() - interval '1 day';

create index if not exists notifications_email_pending_idx
  on public.notifications (created_at) where emailed_at is null;

-- Users may mark their own notifications read, but not touch delivery state
create or replace function public.guard_notification_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') and (
       new.emailed_at     is distinct from old.emailed_at
    or new.email_attempts is distinct from old.email_attempts
    or new.email_error    is distinct from old.email_error
    or new.title          is distinct from old.title
    or new.body           is distinct from old.body
    or new.link           is distinct from old.link
    or new.type           is distinct from old.type
    or new.user_id        is distinct from old.user_id) then
    raise exception 'Only read status can be changed on a notification';
  end if;
  return new;
end $$;

drop trigger if exists guard_notification_update on public.notifications;
create trigger guard_notification_update before update on public.notifications
  for each row execute function public.guard_notification_update();
