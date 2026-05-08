
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'authUserId', p.user_id,
        'name', p.name,
        'email', p.email,
        'role', coalesce((select ur.role::text from public.user_roles ur where ur.user_id = p.id order by case ur.role when 'admin' then 1 when 'user_pro' then 2 else 3 end limit 1), 'user'),
        'phone', p.phone,
        'whatsapp', p.whatsapp,
        'notifications', p.notifications,
        'avatarUrl', p.avatar_url,
        'registeredAt', p.registered_at,
        'lastAccess', p.last_access,
        'plan', p.plan::text,
        'subscriptionStatus', p.subscription_status::text,
        'trialStart', p.trial_start,
        'trialEnd', p.trial_end,
        'subscriptionStart', p.subscription_start,
        'subscriptionEnd', p.subscription_end,
        'nextBillingDate', p.next_billing_date,
        'totalPaid', p.total_paid,
        'balance', p.balance,
        'billingProvider', p.billing_provider::text,
        'transactions', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', t.id,
            'date', t.transaction_date,
            'description', t.description,
            'amount', t.amount,
            'status', t.status,
            'reference', t.reference,
            'planType', t.plan_type::text
          ) order by t.transaction_date desc)
          from public.user_payment_transactions t
          where t.user_id = p.id
        ), '[]'::jsonb)
      )
      order by p.registered_at desc
    )
    from public.profiles p
    where p.deleted_at is null
  ), '[]'::jsonb);
end;
$function$;
