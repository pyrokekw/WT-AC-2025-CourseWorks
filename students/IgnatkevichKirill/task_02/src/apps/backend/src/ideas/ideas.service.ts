import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { IdeaStatus } from '@prisma/client';

@Injectable()
export class IdeasService {
  constructor(private prismaService: PrismaService) {} // Переименовали для ясности

  async create(dto: CreateIdeaDto, userId: string) {
    console.log('Создание идеи для пользователя:', userId);
    
    // Используем this.prismaService.prisma.idea (дважды prisma)
    return this.prismaService.prisma.idea.create({
      data: {
        title: dto.title,
        description: dto.description,
        authorId: userId,
        status: 'PENDING',
        rating: 0,
        tags: dto.tags && dto.tags.length > 0
          ? {
              connectOrCreate: dto.tags.map((name) => ({
                where: { name },
                create: { name },
              })),
            }
          : undefined,
      },
      include: {
        tags: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(status?: IdeaStatus) {
    console.log('🔍 Фильтр по статусу:', status);
    
    const where = status ? { status } : {};
    console.log('📍 Условие WHERE:', where);
    
    const result = await this.prismaService.prisma.idea.findMany({
      where,
      include: { 
        author: { 
          select: { name: true } 
        } 
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log('📊 Найдено записей:', result.length);
    return result;
  }

  async findOne(id: string) {
    return this.prismaService.prisma.idea.findUnique({
      where: { id },
      include: {
        tags: true,
        author: { select: { id: true, name: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        votes: true,
      },
    });
  }

  async updateStatus(id: string, status: IdeaStatus) {
    console.log(`🔄 Обновление статуса идеи ${id} на ${status}`);
    
    const result = await this.prismaService.prisma.idea.update({
      where: { id },
      data: { status },
      include: {
        tags: true,
        author: { select: { id: true, name: true } },
      },
    });
    
    console.log('✅ Статус обновлен:', result.status);
    return result;
  }
}