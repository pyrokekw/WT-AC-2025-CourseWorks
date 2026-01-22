import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(ideaId: string, userId: string, dto: CreateCommentDto) {
    // Проверяем, существует ли идея (опционально, но полезно)
    const idea = await this.prisma.prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) throw new NotFoundException('Идея не найдена');

    return this.prisma.prisma.comment.create({
      data: {
        content: dto.content,
        ideaId,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findByIdea(ideaId: string) {
    return this.prisma.prisma.comment.findMany({
      where: { ideaId },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(commentId: string, userId: string, userRole: string) {
    const comment = await this.prisma.prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    // Права:
    // - Админ может удалить любой
    // - Пользователь — только свой
    if (userRole !== 'ADMIN' && comment.authorId !== userId) {
      throw new ForbiddenException('Нет прав на удаление этого комментария');
    }

    return this.prisma.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}