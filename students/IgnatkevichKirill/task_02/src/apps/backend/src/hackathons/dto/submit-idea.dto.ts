import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SubmitIdeaDto {
  @ApiProperty({
    description: 'UUID идеи для подачи на хакатон',
    example: '423e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsString()
  ideaId: string;
}