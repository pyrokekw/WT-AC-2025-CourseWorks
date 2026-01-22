import { Router } from 'express';
import { getFavorites, createFavorite, deleteFavorite } from '../controllers/favorites.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createFavoriteSchema } from '../lib/validation';

const router = Router();

router.get('/', authenticate, authorize('user', 'moderator', 'admin'), getFavorites);
router.post('/', authenticate, authorize('user', 'moderator', 'admin'), validate(createFavoriteSchema), createFavorite);
router.delete('/:id', authenticate, authorize('user', 'moderator', 'admin'), deleteFavorite);

export default router;
