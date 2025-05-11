import express, { Request, Response, NextFunction } from 'express';
import { upsertEntity, reorderEntities } from '../prisma/adminEntityUtils';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// Middleware placeholder for admin check
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // TODO: Implement real admin check
  // if (!req.user || !req.user.isAdmin) return res.status(403).send('Forbidden');
  next();
}

// List locations
router.get('/location', requireAdmin, async (req: Request, res: Response) => {
  const locations = await prisma.location.findMany({ orderBy: { order: 'asc' } });
  res.json(locations);
});

// List projects
router.get('/project', requireAdmin, async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({ orderBy: { order: 'asc' } });
  res.json(projects);
});

// Create or edit entity
router.post('/entity', requireAdmin, async (req: Request, res: Response) => {
  const { type, data, id } = req.body;
  try {
    const result = await upsertEntity(type, data, id);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Reorder entities
router.post('/entity/reorder', requireAdmin, async (req: Request, res: Response) => {
  const { type, orderedIds } = req.body;
  try {
    await reorderEntities(type, orderedIds);
    res.sendStatus(204);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router; 