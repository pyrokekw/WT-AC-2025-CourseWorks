import { Router } from 'express';
import { getSources, getSource, createSource, updateSource, deleteSource } from '../controllers/sources.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createSourceSchema, updateSourceSchema } from '../lib/validation';

const router = Router();

router.get('/', getSources);
router.get('/:id', getSource);
router.post('/', authenticate, authorize('admin'), validate(createSourceSchema), createSource);
router.put('/:id', authenticate, authorize('admin'), validate(updateSourceSchema), updateSource);
router.delete('/:id', authenticate, authorize('admin'), deleteSource);

export default router;
