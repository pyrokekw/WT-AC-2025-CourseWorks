import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IdeasService } from './ideas.service';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IdeaStatus } from '@prisma/client';

@ApiTags('ideas')
@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Get()
  @ApiOperation({ summary: 'Получение всех идей' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: IdeaStatus,
    description: 'Фильтр по статусу идеи',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Список идей получен успешно',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  findAll(@Query('status') status?: IdeaStatus) {
    return this.ideasService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получение идеи по ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID идеи',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Идея найдена',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Идея не найдена',
  })
  findOne(@Param('id') id: string) {
    return this.ideasService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создание новой идеи' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Идея успешно создана',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Некорректные данные',
  })
  @ApiBody({ type: CreateIdeaDto })
  create(@Body() dto: CreateIdeaDto, @Request() req) {
    return this.ideasService.create(dto, req.user.userId);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновление статуса идеи (только админ)' })
  @ApiParam({
    name: 'id',
    description: 'UUID идеи',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Статус идеи успешно обновлен',
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
    status: HttpStatus.FORBIDDEN,
    description: 'Недостаточно прав (требуется роль ADMIN)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: Object.values(IdeaStatus),
          example: 'APPROVED',
        },
      },
    },
  })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: IdeaStatus,
  ) {
    return this.ideasService.updateStatus(id, status);
  }
}