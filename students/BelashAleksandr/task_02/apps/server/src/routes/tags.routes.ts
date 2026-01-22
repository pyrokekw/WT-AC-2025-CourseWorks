import { Router } from 'express';
import { getTags, getTag, createTag, updateTag, deleteTag } from '../controllers/tags.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createTagSchema, updateTagSchema } from '../lib/validation';

const router = Router();

router.get('/', getTags);
router.get('/:id', getTag);
router.post('/', authenticate, authorize('admin'), validate(createTagSchema), createTag);
router.put('/:id', authenticate, authorize('admin'), validate(updateTagSchema), updateTag);
router.delete('/:id', authenticate, authorize('admin'), deleteTag);

export default router;
