import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VoteDto } from './dto/vote.dto';

@Injectable()
export class VotesService {
  constructor(private prisma: PrismaService) {}

  async vote(ideaId: string, userId: string, dto: VoteDto) {
    // Проверяем, голосовал ли уже этот пользователь за эту идею
    const existingVote = await this.prisma.prisma.vote.findUnique({
      where: { userId_ideaId: { userId, ideaId } },
    });

    if (existingVote) {
      throw new BadRequestException('Вы уже проголосовали за эту идею');
    }

    // Создаём голос
    await this.prisma.prisma.vote.create({
      data: {
        value: dto.value,
        ideaId,
        userId,
      },
    });

    // Обновляем рейтинг идеи (сумма всех голосов)
    await this.updateIdeaRating(ideaId);

    return { message: 'Голос учтён' };
  }

  private async updateIdeaRating(ideaId: string) {
    const votes = await this.prisma.prisma.vote.findMany({
      where: { ideaId },
      select: { value: true },
    });

    const rating = votes.reduce((sum, v) => sum + v.value, 0);

    await this.prisma.prisma.idea.update({
      where: { id: ideaId },
      data: { rating },
    });
  }

  async getRating(ideaId: string) {
    const idea = await this.prisma.prisma.idea.findUnique({
      where: { id: ideaId },
      select: { rating: true },
    });
    return { rating: idea?.rating ?? 0 };
  }
}