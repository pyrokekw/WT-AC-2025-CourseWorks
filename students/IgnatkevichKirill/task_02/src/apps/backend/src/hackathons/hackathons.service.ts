import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { SubmitIdeaDto } from './dto/submit-idea.dto';
import { HackathonStatus } from '@prisma/client';

@Injectable()
export class HackathonsService {
  constructor(private prisma: PrismaService) {} // Используем prisma напрямую

  // Создание хакатона (только для админов)
  async create(dto: CreateHackathonDto) {
    return this.prisma.hackathon.create({
      data: {
        ...dto,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        ideaSubmissionEnd: dto.ideaSubmissionEnd ? new Date(dto.ideaSubmissionEnd) : null,
      },
    });
  }

  // Получение всех хакатонов
  async findAll(status?: HackathonStatus) {
    const where = status ? { status } : {};
    
    return this.prisma.hackathon.findMany({
      where,
      include: {
        _count: {
          select: {
            participants: true,
            ideas: true,
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });
  }

  // Получение хакатона по ID
  async findOne(id: string) {
    const hackathon = await this.prisma.hackathon.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            participants: true,
            ideas: true,
          },
        },
        ideas: {
          include: {
            idea: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                tags: true,
              },
            },
          },
          orderBy: {
            votes: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Хакатон не найден');
    }

    return hackathon;
  }

  // Обновление хакатона (только для админов)
  async update(id: string, dto: UpdateHackathonDto) {
    await this.findOne(id);
    
    const updateData: any = { ...dto };
    
    // Преобразуем даты если они есть
    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }
    if (dto.ideaSubmissionEnd) {
      updateData.ideaSubmissionEnd = new Date(dto.ideaSubmissionEnd);
    }
    
    return this.prisma.hackathon.update({
      where: { id },
      data: updateData,
    });
  }

  // Удаление хакатона (только для админов)
  async remove(id: string) {
    await this.findOne(id);
    
    return this.prisma.hackathon.delete({
      where: { id },
    });
  }

  // Присоединение к хакатону
  async joinHackathon(hackathonId: string, userId: string) {
    const hackathon = await this.findOne(hackathonId);
    
    // Проверяем статус хакатона
    if (hackathon.status !== 'UPCOMING' && hackathon.status !== 'SUBMISSION') {
      throw new BadRequestException('Нельзя присоединиться к хакатону в текущей фазе');
    }

    // Проверяем, не присоединился ли уже
    const existingParticipant = await this.prisma.hackathonParticipant.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId,
        },
      },
    });

    if (existingParticipant) {
      throw new BadRequestException('Вы уже присоединились к этому хакатону');
    }

    return this.prisma.hackathonParticipant.create({
      data: {
        hackathonId,
        userId,
      },
      include: {
        hackathon: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Подача идеи на хакатон
  async submitIdea(hackathonId: string, userId: string, dto: SubmitIdeaDto) {
    const hackathon = await this.findOne(hackathonId);
    
    // Проверяем фазу хакатона
    if (hackathon.status !== 'SUBMISSION') {
      throw new BadRequestException('Приём идей закрыт');
    }

    // Проверяем, присоединился ли пользователь к хакатону
    const participant = await this.prisma.hackathonParticipant.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException('Сначала присоединитесь к хакатону');
    }

    // Проверяем лимит идей
    if (participant.ideasSubmitted >= hackathon.maxIdeasPerUser) {
      throw new BadRequestException(`Лимит идей исчерпан (максимум ${hackathon.maxIdeasPerUser})`);
    }

    // Проверяем, принадлежит ли идея пользователю
    const idea = await this.prisma.idea.findUnique({
      where: { id: dto.ideaId },
    });

    if (!idea) {
      throw new NotFoundException('Идея не найдена');
    }

    if (idea.authorId !== userId) {
      throw new ForbiddenException('Вы можете подавать только свои идеи');
    }

    // Проверяем, не подана ли уже эта идея
    const existingHackathonIdea = await this.prisma.hackathonIdea.findUnique({
      where: {
        hackathonId_ideaId: {
          hackathonId,
          ideaId: dto.ideaId,
        },
      },
    });

    if (existingHackathonIdea) {
      throw new BadRequestException('Эта идея уже подана на хакатон');
    }

    // Создаём связь идеи с хакатоном
    const hackathonIdea = await this.prisma.hackathonIdea.create({
      data: {
        hackathonId,
        ideaId: dto.ideaId,
      },
      include: {
        idea: {
          include: {
            author: true,
            tags: true,
          },
        },
      },
    });

    // Обновляем счетчик идей участника
    await this.prisma.hackathonParticipant.update({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId,
        },
      },
      data: {
        ideasSubmitted: {
          increment: 1,
        },
      },
    });

    return hackathonIdea;
  }

  // Голосование за идею в хакатоне
  async voteForIdea(hackathonId: string, hackathonIdeaId: string, userId: string) {
  const hackathon = await this.findOne(hackathonId);
  
  // Проверяем фазу голосования
  if (hackathon.status !== 'VOTING') {
    throw new BadRequestException('Голосование закрыто');
  }

  // Проверяем, присоединился ли пользователь к хакатону
  const participant = await this.prisma.hackathonParticipant.findUnique({
    where: {
      hackathonId_userId: {
        hackathonId,
        userId,
      },
    },
  });

  if (!participant) {
    throw new ForbiddenException('Вы не участвуете в этом хакатоне');
  }

  // Находим идею хакатона
  const hackathonIdea = await this.prisma.hackathonIdea.findUnique({
    where: { 
      id: hackathonIdeaId, // ← исправлено: ищем по hackathonIdeaId
      hackathonId: hackathonId // дополнительная проверка
    },
    include: {
      idea: true,
    },
  });

  if (!hackathonIdea) {
    throw new NotFoundException('Идея не найдена в хакатоне');
  }

  // Проверяем, не голосует ли пользователь за свою идею
  if (hackathonIdea.idea.authorId === userId) {
    throw new BadRequestException('Нельзя голосовать за свою идею');
  }

  // Обновляем счетчик голосов
  return this.prisma.hackathonIdea.update({
    where: { id: hackathonIdeaId },
    data: {
      votes: {
        increment: 1,
      },
    },
    include: {
      idea: {
        include: {
          author: true,
        },
      },
    },
  });
}
  // Получение топ идей хакатона
  async getLeaderboard(hackathonId: string, limit: number = 10) {
    await this.findOne(hackathonId);
    
    return this.prisma.hackathonIdea.findMany({
      where: { hackathonId },
      include: {
        idea: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
            tags: true,
          },
        },
      },
      orderBy: {
        votes: 'desc',
      },
      take: limit,
    });
  }

  // Обновление статуса хакатона (для админов и автоматического планировщика)
  async updateStatus(id: string, status: HackathonStatus) {
    await this.findOne(id);
    
    return this.prisma.hackathon.update({
      where: { id },
      data: { status },
    });
  }

  async checkParticipant(hackathonId: string, userId: string) {
    const participant = await this.prisma.hackathonParticipant.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId,
        },
      },
    });
    
    return { isParticipant: !!participant };
  }
}