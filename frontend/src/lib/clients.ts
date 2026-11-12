import { apiFetchPrivate } from './api';
import type { QuoteStatus, WorksiteStatus } from './labels';

export type Client = {
  id: number;
  code: string;
  name: string;
  isCompany: boolean;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
};

export type ClientQuote = {
  id: number;
  reference: string;
  title: string;
  status: QuoteStatus;
  validUntil: string | null; // date-heure ISO (la fiche client ne renvoie pas AAAA-MM-JJ)
};

export type ClientWorksite = {
  id: number;
  reference: string;
  title: string;
  status: WorksiteStatus;
  dueDate: string | null; // date-heure ISO
};

export type ClientDetail = Client & {
  quotes: ClientQuote[];
  worksites: ClientWorksite[];
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** Page de clients de l'atelier, triés par nom. */
export async function listClients({
  search,
  page = 1,
}: {
  search?: string;
  page?: number;
} = {}) {
  const params = new URLSearchParams();
  if (search) {
    params.set('search', search);
  }
  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  const { data, meta } = await apiFetchPrivate<{
    data: Client[];
    meta: Pagination;
  }>(`/api/clients${query ? `?${query}` : ''}`);

  return { clients: data, pagination: meta };
}

/** Fiche d'un client, avec ses devis et ses chantiers. Lève une ApiError 404 s'il n'existe pas. */
export async function getClient(id: number) {
  const { data } = await apiFetchPrivate<{ data: ClientDetail }>(
    `/api/clients/${id}`
  );
  return data;
}
