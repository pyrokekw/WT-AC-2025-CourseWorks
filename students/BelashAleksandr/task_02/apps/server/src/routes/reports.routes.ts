import { Router } from 'express';
import { getReports, getReport, createReport, updateReport } from '../controllers/reports.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createReportSchema, updateReportSchema } from '../lib/validation';

const router = Router();

router.get('/', authenticate, authorize('admin', 'moderator'), getReports);
router.get('/:id', authenticate, authorize('admin', 'moderator'), getReport);
router.post('/', authenticate, authorize('user', 'moderator', 'admin'), validate(createReportSchema), createReport);
router.put('/:id', authenticate, authorize('admin', 'moderator'), validate(updateReportSchema), updateReport);

export default router;
