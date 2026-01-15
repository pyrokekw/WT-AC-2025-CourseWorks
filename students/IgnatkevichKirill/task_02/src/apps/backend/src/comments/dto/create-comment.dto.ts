import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Текст комментария',
    example: 'Это отличная идея! Я бы добавил возможность интеграции с API...',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'Комментарий не может быть пустым' })
  content: string;
}