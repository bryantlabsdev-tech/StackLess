alter table public.employee_invites
  add column if not exists sms_sent_at timestamptz;

alter table public.employee_invites
  add column if not exists sms_send_error text;
