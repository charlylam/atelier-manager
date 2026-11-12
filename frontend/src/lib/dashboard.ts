import { apiFetchPrivate } from './api';
import type { QuoteStatus, WorksiteStatus } from './labels';

export type LateWorksite = {
  id: number;
  reference: string;
  title: string;
  status: Exclude<WorksiteStatus, 'delivered' | 'canceled'>;
  dueDate: string;
  daysLate: number;
  client: { id: number; code: string; name: string };
};

export type Dashboard = {
  worksites: {
    byStatus: Record<WorksiteStatus, number>;
    late: { total: number; items: LateWorksite[] };
  };
  quotes: {
    byStatus: Record<QuoteStatus, number>;
    pending: { count: number; totalInclTax: string };
  };
  revenue: {
    month: string;
    deliveredWorksites: number;
    totalExclTax: string;
    totalVat: string;
    totalInclTax: string;
  };
};

/** Tableau de bord de l'atelier. `month` (AAAA-MM) choisit le mois du chiffre d'affaires. */
export async function getDashboard(month?: string) {
  const query = month ? `?month=${encodeURIComponent(month)}` : '';
  const { data } = await apiFetchPrivate<{ data: Dashboard }>(
    `/api/dashboard${query}`
  );
  return data;
}
