import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateIdeaDto {
  @ApiProperty({
    description: 'Заголовок идеи',
    example: 'Экологичный транспорт на солнечных батареях',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Подробное описание идеи',
    example: 'Разработка системы общественного транспорта, работающего исключительно на солнечной энергии...',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Теги для классификации идеи',
    example: ['экология', 'транспорт', 'инновации', 'зелёные технологии'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}