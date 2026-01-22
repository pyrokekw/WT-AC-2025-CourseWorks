import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminOnly } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Получить все заявки (доступно всем)
router.get('/', async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: {
        category: true,
        author: { select: { id: true, name: true, email: true } },
        comments: { include: { author: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения заявок' });
  }
});

// Создать новую заявку (только авторизованные)
router.post('/', authMiddleware, async (req: any, res) => {
  const { title, description, categoryId, lat, lng, address } = req.body;

  if (!title || !description || !categoryId) {
    return res.status(400).json({ error: 'Обязательные поля: title, description, categoryId' });
  }

  try {
    const report = await prisma.report.create({
      data: {
        title,
        description,
        categoryId,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        address: address || null,
        authorId: req.user.id,
      },
    });
    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка создания заявки' });
  }
});

// Получить одну заявку по ID (доступно всем)
router.get('/:id', async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        author: { select: { id: true, name: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!report) return res.status(404).json({ error: 'Заявка не найдена' });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения заявки' });
  }
});

// Изменить статус заявки (только админ)
router.patch('/:id/status', authMiddleware, adminOnly, async (req: any, res) => {
  const { status } = req.body;

  const validStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Неверный статус. Допустимые: ${validStatuses.join(', ')}` });
  }

  try {
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: { status },
      include: { category: true, author: { select: { name: true } } },
    });
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка изменения статуса' });
  }
});

export default router;