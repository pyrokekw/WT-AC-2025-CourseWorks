import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post('idea/:ideaId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавление комментария к идее' })
  @ApiParam({
    name: 'ideaId',
    description: 'UUID идеи',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Комментарий успешно добавлен',
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
    status: HttpStatus.BAD_REQUEST,
    description: 'Некорректные данные',
  })
  @ApiBody({ type: CreateCommentDto })
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('ideaId') ideaId: string,
    @Body() dto: CreateCommentDto,
    @Request() req,
  ) {
    return this.commentsService.create(ideaId, req.user.userId, dto);
  }

  @Get('idea/:ideaId')
  @ApiOperation({ summary: 'Получение всех комментариев к идее' })
  @ApiParam({
    name: 'ideaId',
    description: 'UUID идеи',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Список комментариев получен успешно',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Идея не найдена',
  })
  findByIdea(@Param('ideaId') ideaId: string) {
    return this.commentsService.findByIdea(ideaId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удаление комментария' })
  @ApiParam({
    name: 'id',
    description: 'UUID комментария',
    example: '223e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Комментарий успешно удален',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Комментарий не найден',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Недостаточно прав для удаления комментария',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @Request() req) {
    return this.commentsService.delete(id, req.user.userId, req.user.role);
  }
}