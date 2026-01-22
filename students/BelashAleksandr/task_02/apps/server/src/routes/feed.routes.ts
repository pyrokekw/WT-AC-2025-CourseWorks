import { Router } from 'express';
import { getFeed, getArticle } from '../controllers/feed.controller';

const router = Router();

router.get('/', getFeed);
router.get('/:id', getArticle);

export default router;
