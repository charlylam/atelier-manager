import type { Request, Response } from 'express';
import {
  createQuote,
  deleteLine,
  findQuote,
  insertLine,
  modifyLine,
  modifyQuote,
  searchQuotes,
  transitionQuote,
} from '../services/quote.service.js';
import {
  createLineBodySchema,
  createQuoteBodySchema,
  lineParamSchema,
  listQuotesQuerySchema,
  quoteIdParamSchema,
  quoteStatusBodySchema,
  updateLineBodySchema,
  updateQuoteBodySchema,
} from '../validators/quote.validator.js';

export async function listQuotes(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const query = listQuotesQuerySchema.parse(req.query);

  const result = await searchQuotes(workshopId, query);

  return res.status(200).json(result);
}

export async function getQuote(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = quoteIdParamSchema.parse(req.params);

  const quote = await findQuote(workshopId, id);

  return res.status(200).json({ data: quote });
}

export async function addQuote(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const data = createQuoteBodySchema.parse(req.body);

  const quote = await createQuote(workshopId, data);

  return res.status(201).json({ data: quote });
}

export async function updateQuote(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = quoteIdParamSchema.parse(req.params);
  const data = updateQuoteBodySchema.parse(req.body);

  const quote = await modifyQuote(workshopId, id, data);

  return res.status(200).json({ data: quote });
}

export async function updateQuoteStatus(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = quoteIdParamSchema.parse(req.params);
  const { status } = quoteStatusBodySchema.parse(req.body);

  const quote = await transitionQuote(workshopId, id, status);

  return res.status(200).json({ data: quote });
}

export async function addQuoteLine(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = quoteIdParamSchema.parse(req.params);
  const data = createLineBodySchema.parse(req.body);

  const quote = await insertLine(workshopId, id, data);

  return res.status(201).json({ data: quote });
}

export async function updateQuoteLine(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id, lineId } = lineParamSchema.parse(req.params);
  const data = updateLineBodySchema.parse(req.body);

  const quote = await modifyLine(workshopId, id, lineId, data);

  return res.status(200).json({ data: quote });
}

export async function removeQuoteLine(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id, lineId } = lineParamSchema.parse(req.params);

  const quote = await deleteLine(workshopId, id, lineId);

  return res.status(200).json({ data: quote });
}
