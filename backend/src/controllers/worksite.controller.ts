import type { Request, Response } from 'express';
import {
  addPhase,
  createWorksiteFromQuote,
  findWorksite,
  modifyPhase,
  modifyWorksite,
  removePhase,
  reorderPhases,
  searchWorksites,
  transitionWorksite,
} from '../services/worksite.service.js';
import {
  createPhaseBodySchema,
  createWorksiteBodySchema,
  listWorksitesQuerySchema,
  phaseParamSchema,
  reorderPhasesBodySchema,
  updatePhaseBodySchema,
  updateWorksiteBodySchema,
  worksiteIdParamSchema,
  worksiteStatusBodySchema,
} from '../validators/worksite.validator.js';

export async function listWorksites(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const query = listWorksitesQuerySchema.parse(req.query);

  const result = await searchWorksites(workshopId, query);

  return res.status(200).json(result);
}

export async function getWorksite(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = worksiteIdParamSchema.parse(req.params);

  const worksite = await findWorksite(workshopId, id);

  return res.status(200).json({ data: worksite });
}

// 201 à la création, 200 si le devis avait déjà produit un chantier.
export async function addWorksite(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const input = createWorksiteBodySchema.parse(req.body);

  const { worksite, created } = await createWorksiteFromQuote(
    workshopId,
    input
  );

  return res.status(created ? 201 : 200).json({ data: worksite });
}

export async function updateWorksite(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = worksiteIdParamSchema.parse(req.params);
  const data = updateWorksiteBodySchema.parse(req.body);

  const worksite = await modifyWorksite(workshopId, id, data);

  return res.status(200).json({ data: worksite });
}

export async function updateWorksiteStatus(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = worksiteIdParamSchema.parse(req.params);
  const { status } = worksiteStatusBodySchema.parse(req.body);

  const worksite = await transitionWorksite(workshopId, id, status);

  return res.status(200).json({ data: worksite });
}

export async function addWorksitePhase(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = worksiteIdParamSchema.parse(req.params);
  const data = createPhaseBodySchema.parse(req.body);

  const worksite = await addPhase(workshopId, id, data);

  return res.status(201).json({ data: worksite });
}

export async function updateWorksitePhase(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id, phaseId } = phaseParamSchema.parse(req.params);
  const data = updatePhaseBodySchema.parse(req.body);

  const worksite = await modifyPhase(workshopId, id, phaseId, data);

  return res.status(200).json({ data: worksite });
}

export async function removeWorksitePhase(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id, phaseId } = phaseParamSchema.parse(req.params);

  const worksite = await removePhase(workshopId, id, phaseId);

  return res.status(200).json({ data: worksite });
}

export async function reorderWorksitePhases(req: Request, res: Response) {
  const { workshopId } = req.user!;
  const { id } = worksiteIdParamSchema.parse(req.params);
  const { phaseIds } = reorderPhasesBodySchema.parse(req.body);

  const worksite = await reorderPhases(workshopId, id, phaseIds);

  return res.status(200).json({ data: worksite });
}
