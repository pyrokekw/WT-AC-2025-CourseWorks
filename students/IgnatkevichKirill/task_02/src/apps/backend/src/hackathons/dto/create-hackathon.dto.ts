import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { HackathonStatus } from '@prisma/client';

export class CreateHackathonDto {
  @ApiProperty({
    description: 'Название хакатона',
    example: 'AI Innovation Challenge 2024',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Описание хакатона',
    example: 'Хакатон по разработке решений в области искусственного интеллекта',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Тема хакатона',
    example: 'Искусственный интеллект и машинное обучение',
    required: false,
  })
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiProperty({
    description: 'Дата и время начала хакатона (ISO формат)',
    example: '2024-12-01T10:00:00.000Z',
    required: true,
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Дата и время окончания хакатона (ISO формат)',
    example: '2024-12-05T18:00:00.000Z',
    required: true,
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Дата и время окончания приёма идей (ISO формат)',
    example: '2024-12-03T23:59:59.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  ideaSubmissionEnd?: string;

  @ApiProperty({
    description: 'Максимальное количество идей, которые может подать один участник',
    example: 3,
    default: 3,
    minimum: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxIdeasPerUser?: number = 3;

  @ApiProperty({
    description: 'Правила участия в хакатоне',
    example: '1. Все участники должны зарегистрироваться на платформе\n2. Идеи должны быть оригинальными\n3. Запрещено копирование чужих работ',
    required: false,
  })
  @IsString()
  @IsOptional()
  rules?: string;

  @ApiProperty({
    description: 'Статус хакатона',
    enum: HackathonStatus,
    example: 'UPCOMING',
    default: 'UPCOMING',
    required: false,
  })
  @IsEnum(HackathonStatus)
  @IsOptional()
  status?: HackathonStatus = 'UPCOMING';
}