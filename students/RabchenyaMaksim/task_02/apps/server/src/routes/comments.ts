import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// Получить комментарии к заявке
router.get('/:reportId', async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { reportId: req.params.reportId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(comments)
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения комментариев' })
  }
})

// Добавить комментарий (только залогиненные)
router.post('/', authMiddleware, async (req: any, res) => {
  const { text, reportId } = req.body

  if (!text || !reportId) {
    return res.status(400).json({ error: 'Текст и ID заявки обязательны' })
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        text,
        reportId,
        authorId: req.user.id,
      },
      include: { author: { select: { name: true } } },
    })
    res.status(201).json(comment)
  } catch (err) {
    res.status(500).json({ error: 'Ошибка создания комментария' })
  }
})

export default router