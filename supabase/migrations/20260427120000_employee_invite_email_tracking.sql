-- Track outbound invite emails (delivery vs acceptance lifecycle).
alter table public.employee_invites
  add column if not exists email_sent_at timestamptz;

alter table public.employee_invites
  add column if not exists email_send_error text;
