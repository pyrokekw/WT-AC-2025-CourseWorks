import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsInt, Min, IsEnum, IsString } from 'class-validator';
import { HackathonStatus } from '@prisma/client';

export class UpdateHackathonDto {
  @ApiProperty({
    description: 'Название хакатона',
    example: 'Updated AI Challenge 2024',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Описание хакатона',
    example: 'Обновлённое описание хакатона',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Тема хакатона',
    example: 'Обновлённая тема',
    required: false,
  })
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiProperty({
    description: 'Дата и время начала хакатона (ISO формат)',
    example: '2024-12-02T10:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Дата и время окончания хакатона (ISO формат)',
    example: '2024-12-06T18:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Дата и время окончания приёма идей (ISO формат)',
    example: '2024-12-04T23:59:59.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  ideaSubmissionEnd?: string;

  @ApiProperty({
    description: 'Максимальное количество идей, которые может подать один участник',
    example: 5,
    minimum: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxIdeasPerUser?: number;

  @ApiProperty({
    description: 'Правила участия в хакатоне',
    example: 'Обновлённые правила участия...',
    required: false,
  })
  @IsString()
  @IsOptional()
  rules?: string;

  @ApiProperty({
    description: 'Статус хакатона',
    enum: HackathonStatus,
    example: 'VOTING',
    required: false,
  })
  @IsEnum(HackathonStatus)
  @IsOptional()
  status?: HackathonStatus;
}