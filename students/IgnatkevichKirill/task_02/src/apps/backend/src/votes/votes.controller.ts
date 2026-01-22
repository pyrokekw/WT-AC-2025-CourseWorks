import { 
  Controller, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Request, 
  Get,
  HttpStatus 
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VotesService } from './votes.service';
import { VoteDto } from './dto/vote.dto';

@ApiTags('votes')
@Controller('votes')
export class VotesController {
  constructor(private votesService: VotesService) {}

  @Post('idea/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Голосование за идею' })
  @ApiParam({
    name: 'id',
    description: 'UUID идеи',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Голос успешно учтен',
    schema: {
      example: {
        id: '323e4567-e89b-12d3-a456-426614174000',
        ideaId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '423e4567-e89b-12d3-a456-426614174000',
        value: 1,
        createdAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Идея не найдена',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Вы уже голосовали за эту идею',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Нельзя голосовать за свою идею',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Некорректные данные',
  })
  @ApiBody({ type: VoteDto })
  async vote(
    @Param('id') ideaId: string,
    @Body() dto: VoteDto,
    @Request() req,
  ) {
    return this.votesService.vote(ideaId, req.user.userId, dto);
  }

  @Get('idea/:id/rating')
  @ApiOperation({ summary: 'Получение рейтинга идеи' })
  @ApiParam({
    name: 'id',
    description: 'UUID идеи',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Рейтинг получен успешно',
    schema: {
      example: {
        ideaId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 15,
        upvotes: 20,
        downvotes: 5,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Идея не найдена',
  })
  async getRating(@Param('id') ideaId: string) {
    return this.votesService.getRating(ideaId);
  }
}