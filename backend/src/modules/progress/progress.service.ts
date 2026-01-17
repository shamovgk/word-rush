import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LoggerService } from '../../common/logger/logger.service';
import { SubmitResultDto } from './dto/submit-result.dto';

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async submitResult(userId: string, dto: SubmitResultDto) {
    this.logger.log(
      `Submitting result for user ${userId}, level ${dto.levelId}: score ${dto.score}, stars ${dto.stars}`,
      'ProgressService',
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const attempt = await tx.levelAttempt.create({
        data: {
          userId,
          levelId: dto.levelId,
          score: dto.score,
          stars: dto.stars,
          correctAnswers: dto.correctAnswers,
          wrongAnswers: dto.wrongAnswers,
          duration: dto.duration,
        },
      });

      const level = await tx.level.findUnique({
        where: { id: dto.levelId },
        select: { id: true, packId: true },
      });

      if (!level) {
        this.logger.error(`Level not found: ${dto.levelId}`, '', 'ProgressService');
        throw new NotFoundException('Level not found');
      }

      const existingProgress = await tx.userLevelProgress.findUnique({
        where: {
          userId_levelId: { userId, levelId: dto.levelId },
        },
      });

      if (existingProgress) {
        await tx.userLevelProgress.update({
          where: { id: existingProgress.id },
          data: {
            bestScore: Math.max(existingProgress.bestScore, dto.score),
            highestStars: Math.max(existingProgress.highestStars, dto.stars),
            timesPlayed: existingProgress.timesPlayed + 1,
            completedAt:
              dto.stars > 0 ? new Date() : existingProgress.completedAt,
          },
        });
        this.logger.debug(`Updated progress for level ${dto.levelId}`, 'ProgressService');
      } else {
        await tx.userLevelProgress.create({
          data: {
            userId,
            levelId: dto.levelId,
            bestScore: dto.score,
            highestStars: dto.stars,
            timesPlayed: 1,
            completedAt: dto.stars > 0 ? new Date() : null,
          },
        });
        this.logger.debug(`Created new progress for level ${dto.levelId}`, 'ProgressService');
      }

      const xpGained = this.calculateXP(dto);
      await tx.profile.update({
        where: { userId },
        data: {
          totalXp: { increment: xpGained },
          lastPlayedAt: new Date(),
        },
      });

      this.logger.log(`XP awarded: ${xpGained} for user ${userId}`, 'ProgressService');

      return { attempt, xpGained };
    });

    await this.checkAchievements(userId);

    this.logger.log(`Result submitted successfully for user ${userId}`, 'ProgressService');

    return {
      success: true,
      attempt: result.attempt,
      message: `Уровень завершен! +${result.xpGained} XP`,
    };
  }

  private calculateXP(dto: SubmitResultDto): number {
    let xp = dto.correctAnswers * 10;
    xp += dto.stars * 50;
    return xp;
  }

  async getUserProgress(userId: string) {
    this.logger.log(`Fetching progress for user: ${userId}`, 'ProgressService');

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    const levelProgress = await this.prisma.userLevelProgress.findMany({
      where: { userId },
      include: {
        level: {
          include: {
            pack: {
              select: {
                id: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    const achievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: 'desc' },
    });

    this.logger.log(
      `Progress fetched: ${levelProgress.length} levels, ${achievements.length} achievements`,
      'ProgressService',
    );

    return {
      profile,
      levelProgress,
      achievements,
    };
  }

  // ✅ ОБНОВЛЕН: добавлена пагинация
  async getLevelAttempts(
    userId: string,
    levelId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    this.logger.log(
      `Fetching attempts for user ${userId}, level ${levelId} (page ${page}, limit ${limit})`,
      'ProgressService',
    );

    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.levelAttempt.findMany({
        where: { userId, levelId },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.levelAttempt.count({
        where: { userId, levelId },
      }),
    ]);

    this.logger.log(
      `Found ${attempts.length} attempts (total: ${total})`,
      'ProgressService',
    );

    return {
      data: attempts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async checkAchievements(userId: string) {
    this.logger.debug(`Checking achievements for user: ${userId}`, 'ProgressService');

    const completedLevels = await this.prisma.userLevelProgress.count({
      where: {
        userId,
        highestStars: { gte: 1 },
      },
    });

    if (completedLevels >= 1) {
      await this.unlockAchievement(userId, 'first_level');
    }

    if (completedLevels >= 5) {
      await this.unlockAchievement(userId, 'five_levels');
    }

    if (completedLevels >= 10) {
      await this.unlockAchievement(userId, 'ten_levels');
    }
  }

  private async unlockAchievement(userId: string, key: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { key },
    });

    if (!achievement) {
      this.logger.warn(`Achievement not found: ${key}`, 'ProgressService');
      return;
    }

    const existing = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievement.id,
        },
      },
    });

    if (!existing) {
      await this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
        },
      });
      this.logger.log(`Achievement unlocked: ${key} for user ${userId}`, 'ProgressService');
    }
  }
  async getPackProgress(userId: string, packId: string) {
  this.logger.log(`Fetching pack progress for user ${userId}, pack ${packId}`, 'ProgressService');

  const pack = await this.prisma.pack.findUnique({
    where: { id: packId },
    include: {
      levels: {
        orderBy: { levelNumber: 'asc' },
        include: {
          levelProgress: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!pack) {
    throw new NotFoundException('Pack not found');
  }

  const levels = pack.levels.map((level, index) => {
    const progress = level.levelProgress[0];
    const previousLevel = index > 0 ? pack.levels[index - 1] : null;
    const previousProgress = previousLevel?.levelProgress[0];
    
    // Первый уровень всегда разблокирован, остальные только если предыдущий завершен
    const isUnlocked = index === 0 || (previousProgress?.highestStars ?? 0) > 0;

    return {
      id: level.id,
      levelNumber: level.levelNumber,
      mode: level.mode,
      difficulty: level.difficulty,
      stars: progress?.highestStars ?? 0,
      bestScore: progress?.bestScore ?? 0,
      isCompleted: (progress?.highestStars ?? 0) > 0,
      isUnlocked,
      timesPlayed: progress?.timesPlayed ?? 0,
    };
  });

  return {
    packId: pack.id,
    title: pack.title,
    description: pack.description,
    icon: pack.icon,
    levels,
    totalLevels: levels.length,
    completedLevels: levels.filter(l => l.isCompleted).length,
    totalStars: levels.reduce((sum, l) => sum + l.stars, 0),
    maxStars: levels.length * 3,
  };
}

  async getPackDictionary(userId: string, packId: string) {
    this.logger.log(`Fetching dictionary for pack ${packId}, user ${userId}`, 'ProgressService');

    const attempts = await this.prisma.levelAttempt.findMany({
      where: {
        userId,
        level: {
          packId,
        },
      },
      select: {
        id: true,
        score: true,
        stars: true,
        correctAnswers: true,
        wrongAnswers: true,
        completedAt: true,
        level: {
          select: {
            id: true,
            packId: true,
            levelNumber: true,
            lexemes: {
              select: {
                lexeme: {
                  select: {
                    id: true,
                    form: true,
                    meaning: true,
                    contexts: true,
                    difficulty: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    this.logger.debug(`Processing ${attempts.length} attempts for dictionary`, 'ProgressService');

    const lexemeMap = new Map<
      string,
      {
        lexeme: any;
        totalAttempts: number;
        correctAttempts: number;
        wrongAttempts: number;
        lastSeenAt: Date;
      }
    >();

    for (const attempt of attempts) {
      for (const levelLexeme of attempt.level.lexemes) {
        const lexeme = levelLexeme.lexeme;
        const key = lexeme.id;

        if (!lexemeMap.has(key)) {
          lexemeMap.set(key, {
            lexeme,
            totalAttempts: 0,
            correctAttempts: 0,
            wrongAttempts: 0,
            lastSeenAt: attempt.completedAt,
          });
        }

        const entry = lexemeMap.get(key)!;
        entry.totalAttempts += 1;

        if (attempt.stars >= 2) {
          entry.correctAttempts += 1;
        } else {
          entry.wrongAttempts += 1;
        }

        if (attempt.completedAt > entry.lastSeenAt) {
          entry.lastSeenAt = attempt.completedAt;
        }
      }
    }

    const dictionary = Array.from(lexemeMap.entries()).map(([id, data]) => {
      const accuracy =
        data.totalAttempts > 0
          ? data.correctAttempts / data.totalAttempts
          : 0;

      let mastery = 0;
      if (data.totalAttempts >= 1 && accuracy >= 0.8) mastery = 1;
      if (data.totalAttempts >= 2 && accuracy >= 0.85) mastery = 2;
      if (data.totalAttempts >= 3 && accuracy >= 0.9) mastery = 3;
      if (data.totalAttempts >= 5 && accuracy >= 0.95) mastery = 4;
      if (data.totalAttempts >= 8 && accuracy >= 0.98) mastery = 5;

      return {
        id: data.lexeme.id,
        form: data.lexeme.form,
        meaning: data.lexeme.meaning,
        contexts: data.lexeme.contexts,
        difficulty: data.lexeme.difficulty,
        mastery,
        totalAttempts: data.totalAttempts,
        correctAttempts: data.correctAttempts,
        wrongAttempts: data.wrongAttempts,
        accuracy: Math.round(accuracy * 100),
        lastSeenAt: data.lastSeenAt,
      };
    });

    const stats = {
      totalWords: dictionary.length,
      mastered: dictionary.filter((w) => w.mastery === 5).length,
      learning: dictionary.filter((w) => w.mastery >= 1 && w.mastery < 5).length,
      notStarted: dictionary.filter((w) => w.mastery === 0).length,
    };

    this.logger.log(
      `Dictionary generated: ${stats.totalWords} words (${stats.mastered} mastered, ${stats.learning} learning)`,
      'ProgressService',
    );

    return {
      dictionary: dictionary.sort(
        (a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime(),
      ),
      stats,
    };
  }
}
