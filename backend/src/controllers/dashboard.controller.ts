import type { Request, Response } from 'express';
import { getDashboard } from '../services/dashboard.service.js';
import { dashboardQuerySchema } from '../validators/dashboard.validator.js';

export async function getDashboardSummary(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { month } = dashboardQuerySchema.parse(req.query);

  const dashboard = await getDashboard(workshopId, month);

  return res.status(200).json({ data: dashboard });
}
