import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsNotEmpty } from 'class-validator';

export class VoteDto {
  @ApiProperty({
    description: 'Значение голоса (только лайки, значение должно быть 1)',
    example: 1,
    enum: [1],
    required: true,
    minimum: 1,
    maximum: 1,
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty({ message: 'Значение голоса не может быть пустым' })
  value: number;
}