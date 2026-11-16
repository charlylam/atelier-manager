import { apiFetchPrivate } from './api';
import type { Pagination } from './clients';
import type { PhaseStatus, WorksiteStatus } from './labels';

type ClientRef = { id: number; code: string; name: string };

export type WorksiteSummary = {
  id: number;
  reference: string;
  title: string;
  status: WorksiteStatus;
  dueDate: string | null; // AAAA-MM-JJ
  createdAt: string;
  client: ClientRef;
  progress: { done: number; total: number }; // phases terminées / phases
};

export type Phase = {
  id: number;
  position: number;
  name: string;
  status: PhaseStatus;
  estimatedHours: string; // 2 décimales
  actualHours: string;
  notes: string | null;
  assignee: { id: number; firstName: string; lastName: string } | null;
};

export type Worksite = {
  id: number;
  reference: string;
  title: string;
  description: string | null;
  siteAddress: string | null; // vide : le chantier a lieu à l'adresse du client
  status: WorksiteStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  client: ClientRef & { address: string | null };
  quote: { id: number; reference: string };
  phases: Phase[];
  totals: { estimatedHours: string; actualHours: string };
};

/** Page de chantiers de l'atelier, du plus récent au plus ancien. */
export async function listWorksites({
  status,
  search,
  page = 1,
}: {
  status?: WorksiteStatus;
  search?: string;
  page?: number;
} = {}) {
  const params = new URLSearchParams();
  if (status) {
    params.set('status', status);
  }
  if (search) {
    params.set('search', search);
  }
  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  const { data, meta } = await apiFetchPrivate<{
    data: WorksiteSummary[];
    meta: Pagination;
  }>(`/api/worksites${query ? `?${query}` : ''}`);

  return { worksites: data, pagination: meta };
}

/** Détail d'un chantier, avec ses phases et ses totaux. Lève une ApiError 404 s'il n'existe pas. */
export async function getWorksite(id: number) {
  const { data } = await apiFetchPrivate<{ data: Worksite }>(
    `/api/worksites/${id}`
  );
  return data;
}
