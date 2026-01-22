import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createUserSchema, updateUserSchema } from '../lib/validation';

const router = Router();

router.get('/', authenticate, authorize('admin'), getUsers);
router.get('/:id', authenticate, getUser);
router.post('/', authenticate, authorize('admin'), validate(createUserSchema), createUser);
router.put('/:id', authenticate, validate(updateUserSchema), updateUser);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;
