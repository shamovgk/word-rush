import { Controller, Post, Get, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { SubmitResultDto } from './dto/submit-result.dto';

@ApiTags('progress')
@Controller('api/progress')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('submit')
  @ApiOperation({ 
    summary: 'Отправить результат прохождения уровня',
    description: 'Сохраняет попытку, обновляет прогресс пользователя, начисляет XP и проверяет достижения'
  })
  @ApiBody({ type: SubmitResultDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Результат успешно сохранен',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        attempt: { type: 'object' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Уровень не найден' })
  async submitResult(@Request() req, @Body() dto: SubmitResultDto) {
    return this.progressService.submitResult(req.user.id, dto);
  }

  @Get('me')
  @ApiOperation({ 
    summary: 'Получить прогресс текущего пользователя',
    description: 'Возвращает профиль, прогресс по уровням и достижения'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Прогресс пользователя',
    schema: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            totalXp: { type: 'number' },
            level: { type: 'number' },
            streak: { type: 'number' },
            lastPlayedAt: { type: 'string', format: 'date-time' },
          },
        },
        levelProgress: {
          type: 'array',
          items: { type: 'object' },
        },
        achievements: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getMyProgress(@Request() req) {
    return this.progressService.getUserProgress(req.user.id);
  }

  @Get('level/:levelId')
  @ApiOperation({ 
    summary: 'Получить историю попыток уровня',
    description: 'Возвращает список попыток с пагинацией'
  })
  @ApiParam({ name: 'levelId', description: 'ID уровня', type: 'string' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы (по умолчанию 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество на странице (по умолчанию 10)' })
  @ApiResponse({ 
    status: 200, 
    description: 'История попыток с пагинацией',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              score: { type: 'number' },
              stars: { type: 'number' },
              correctAnswers: { type: 'number' },
              wrongAnswers: { type: 'number' },
              duration: { type: 'number' },
              completedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getLevelAttempts(
    @Request() req,
    @Param('levelId') levelId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.progressService.getLevelAttempts(req.user.id, levelId, page, limit);
  }
  @Get('pack/:packId')
  @ApiOperation({ 
    summary: 'Получить прогресс по паку',
    description: 'Возвращает прогресс пользователя по всем уровням пака'
  })
  @ApiParam({ name: 'packId', description: 'ID пака', type: 'string' })
  @ApiResponse({ status: 200, description: 'Прогресс по паку' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getPackProgress(@Request() req, @Param('packId') packId: string) {
    return this.progressService.getPackProgress(req.user.id, packId);
  }
  
  @Get('dictionary/pack/:packId')
  @ApiOperation({ 
    summary: 'Получить словарь пака',
    description: 'Возвращает статистику изучения слов из пака с уровнем мастерства'
  })
  @ApiParam({ name: 'packId', description: 'ID пака', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Словарь пака со статистикой',
    schema: {
      type: 'object',
      properties: {
        dictionary: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              form: { type: 'string' },
              meaning: { type: 'string' },
              contexts: { type: 'array', items: { type: 'string' } },
              difficulty: { type: 'number' },
              mastery: { type: 'number', description: 'Уровень мастерства 0-5' },
              totalAttempts: { type: 'number' },
              correctAttempts: { type: 'number' },
              wrongAttempts: { type: 'number' },
              accuracy: { type: 'number', description: 'Точность в процентах' },
              lastSeenAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        stats: {
          type: 'object',
          properties: {
            totalWords: { type: 'number' },
            mastered: { type: 'number' },
            learning: { type: 'number' },
            notStarted: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async getPackDictionary(@Request() req: any, @Param('packId') packId: string) {
    return this.progressService.getPackDictionary(req.user.id, packId);
  }
}
