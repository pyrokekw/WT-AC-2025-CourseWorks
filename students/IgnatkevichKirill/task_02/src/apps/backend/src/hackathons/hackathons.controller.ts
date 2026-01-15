import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { HackathonsService } from './hackathons.service';
import { CreateHackathonDto } from './dto/create-hackathon.dto';
import { UpdateHackathonDto } from './dto/update-hackathon.dto';
import { SubmitIdeaDto } from './dto/submit-idea.dto';
import { HackathonStatus } from '@prisma/client';

@ApiTags('hackathons')
@ApiBearerAuth()
@Controller('hackathons')
export class HackathonsController {
  constructor(private readonly hackathonsService: HackathonsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Создание нового хакатона' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Хакатон успешно создан',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Недостаточно прав (требуется роль ADMIN)',
  })
  @ApiBody({ type: CreateHackathonDto })
  create(@Body() dto: CreateHackathonDto) {
    return this.hackathonsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получение всех хакатонов' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: HackathonStatus,
    description: 'Фильтр по статусу хакатона',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Список хакатонов получен успешно',
  })
  findAll(@Query('status') status?: HackathonStatus) {
    return this.hackathonsService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получение хакатона по ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID хакатона',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Хакатон найден',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Хакатон не найден',
  })
  findOne(@Param('id') id: string) {
    return this.hackathonsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Обновление информации о хакатоне' })
  @ApiParam({
    name: 'id',
    description: 'UUID хакатона',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Хакатон успешно обновлен',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Хакатон не найден',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Недостаточно прав (требуется роль ADMIN)',
  })
  @ApiBody({ type: UpdateHackathonDto })
  update(@Param('id') id: string, @Body() dto: UpdateHackathonDto) {
    return this.hackathonsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Удаление хакатона' })
  @ApiParam({
    name: 'id',
    description: 'UUID хакатона',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Хакатон успешно удален',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Хакатон не найден',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Недостаточно прав (требуется роль ADMIN)',
  })
  remove(@Param('id') id: string) {
    return this.hackathonsService.remove(id);
  }

  @Post(':id/join')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Присоединение к хакатону' })
  @ApiParam({
    name: 'id',
    description: 'UUID хакатона',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Успешно присоединились к хакатону',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Хакатон не найден',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Нельзя присоединиться к хакатону в текущей фазе',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Вы уже присоединились к этому хакатону',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  joinHackathon(@Param('id') id: string, @Request() req) {
    return this.hackathonsService.joinHackathon(id, req.user.userId);
  }

  @Post(':id/ideas')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Подача идеи на хакатон' })
  @ApiParam({
    name: 'id',
    description: 'UUID хакатона',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Идея успешно подана на хакатон',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Хакатон или идея не найдены',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Недостаточно прав или не присоединились к хакатону',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Приём идей закрыт или лимит исчерпан',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Идея уже подана на этот хакатон',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  @ApiBody({ type: SubmitIdeaDto })
  submitIdea(@Param('id') id: string, @Body() dto: SubmitIdeaDto, @Request() req) {
    return this.hackathonsService.submitIdea(id, req.user.userId, dto);
  }

  @Post(':hackathonId/ideas/:hackathonIdeaId/vote')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Голосование за идею в хакатоне' })
  @ApiParam({
    name: 'hackathonId',
    description: 'UUID хакатона',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'hackathonIdeaId',
    description: 'UUID связи идеи и хакатона (HackathonIdea)',
    example: '223e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Голос успешно учтен',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Хакатон или идея не найдены',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Не участвуете в хакатоне или голосуете за свою идею',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Голосование закрыто',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  voteForIdea(
    @Param('hackathonId') hackathonId: string,
    @Param('hackathonIdeaId') hackathonIdeaId: string,
    @Request() req,
  ) {
    return this.hackathonsService.voteForIdea(hackathonId, hackathonIdeaId, req.user.userId);
  }

  @Get(':id/leaderboard')
  @ApiOperation({ summary: 'Получение таблицы лидеров хакатона' })
  @ApiParam({
    name: 'id',
    description: 'UUID хакатона',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Количество записей (по умолчанию 10)',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Таблица лидеров получена',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Хакатон не найден',
  })
  getLeaderboard(@Param('id') id: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.hackathonsService.getLeaderboard(id, limitNum);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Обновление статуса хакатона' })
  @ApiParam({
    name: 'id',
    description: 'UUID хакатона',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Статус успешно обновлен',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Хакатон не найден',
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
          enum: Object.values(HackathonStatus),
          example: 'VOTING',
        },
      },
    },
  })
  updateStatus(@Param('id') id: string, @Body('status') status: HackathonStatus) {
    return this.hackathonsService.updateStatus(id, status);
  }

  @Get(':hackathonId/participants/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Проверка участия пользователя в хакатоне' })
  @ApiParam({
    name: 'hackathonId',
    description: 'UUID хакатона',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID пользователя',
    example: '323e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Информация о участии получена',
    schema: {
      type: 'object',
      properties: {
        isParticipant: {
          type: 'boolean',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Пользователь не авторизован',
  })
  checkParticipant(
    @Param('hackathonId') hackathonId: string,
    @Param('userId') userId: string,
  ) {
    return this.hackathonsService.checkParticipant(hackathonId, userId);
  }
}