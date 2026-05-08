import { Badge } from '@/components/ui/badge';
import type { PlanType, SubscriptionStatus } from '@/types/auth';

const planColors: Record<PlanType, string> = {
  free: 'bg-muted text-muted-foreground border-border',
  trial: 'bg-amber-50 text-amber-700 border-amber-200',
  premium: 'bg-primary/10 text-primary border-primary/30',
  pro: 'bg-primary/10 text-primary border-primary/30',
  monthly: 'bg-primary/10 text-primary border-primary/30',
  yearly: 'bg-primary/10 text-primary border-primary/30',
  premium_monthly: 'bg-primary/10 text-primary border-primary/30',
  premium_yearly: 'bg-primary/10 text-primary border-primary/30',
};

const planLabels: Record<PlanType, string> = {
  free: 'Free',
  trial: 'Trial',
  premium: 'Premium',
  pro: 'Pro',
  monthly: 'Monthly',
  yearly: 'Yearly',
  premium_monthly: 'Monthly',
  premium_yearly: 'Yearly',
};

const statusColors: Record<SubscriptionStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-muted text-muted-foreground border-border',
  trialing: 'bg-amber-50 text-amber-700 border-amber-200',
  in_trial: 'bg-amber-50 text-amber-700 border-amber-200',
  canceled: 'bg-muted text-muted-foreground border-border',
  expired: 'bg-red-50 text-red-600 border-red-200',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<SubscriptionStatus, string> = {
  active: 'Attivo',
  inactive: 'Inactive',
  trialing: 'In Trial',
  in_trial: 'In Trial',
  canceled: 'Annullato',
  expired: 'Scaduto',
  cancelled: 'Annullato',
};

export function PlanBadge({ plan }: { plan: PlanType }) {
  return <Badge variant="outline" className={`text-xs ${planColors[plan]}`}>{planLabels[plan]}</Badge>;
}

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge variant="outline" className={`text-xs ${statusColors[status]}`}>{statusLabels[status]}</Badge>;
}
