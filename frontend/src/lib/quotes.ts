import { apiFetchPrivate } from './api';
import type { QuoteStatus } from './labels';
import type { Pagination } from './clients';

export type QuoteLineType = 'material' | 'labor' | 'service' | 'other';

export type QuoteLine = {
  id: number;
  position: number;
  type: QuoteLineType;
  label: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  totalExclTax: string;
};

export type QuoteTotals = {
  totalExclTax: string;
  totalVat: string;
  totalInclTax: string;
};

type ClientRef = { id: number; code: string; name: string };

export type QuoteSummary = {
  id: number;
  reference: string;
  title: string;
  status: QuoteStatus;
  validUntil: string | null; // AAAA-MM-JJ
  createdAt: string;
  client: ClientRef;
  totalInclTax: string;
};

export type Quote = {
  id: number;
  reference: string;
  title: string;
  description: string | null;
  status: QuoteStatus;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
  client: ClientRef;
  lines: QuoteLine[];
  totals: QuoteTotals;
};

/** Page de devis de l'atelier, du plus récent au plus ancien. */
export async function listQuotes({
  status,
  search,
  page = 1,
}: {
  status?: QuoteStatus;
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
    data: QuoteSummary[];
    meta: Pagination;
  }>(`/api/quotes${query ? `?${query}` : ''}`);

  return { quotes: data, pagination: meta };
}

/** Détail d'un devis, avec ses lignes et ses totaux. Lève une ApiError 404 s'il n'existe pas. */
export async function getQuote(id: number) {
  const { data } = await apiFetchPrivate<{ data: Quote }>(`/api/quotes/${id}`);
  return data;
}
