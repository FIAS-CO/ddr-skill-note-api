import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Stats {
    totalFlareSkill: number;
    grade: string;
}

export interface PlayerStats {
    createdAt: string;
    updatedAt: string;
    SP: Stats;
    DP: Stats;
    skillHistory: SkillHistoryPoint[]
}

export interface SkillHistoryPoint {
    date: string;          // ISO形式の日付文字列
    spSkillPoint: number;
    dpSkillPoint: number;
}

export class PlayerStatsService {
    async getPlayerStats(playerName: string): Promise<PlayerStats | null> {
        try {
            const player = await prisma.player.findUnique({ where: { name: playerName } });
            if (!player) {
                console.log(`Player not found: ${playerName}`);
                return null;
            }

            // スキル履歴の取得
            const skillHistory = await prisma.playerSkillHistory.findMany({
                where: { playerId: player.id },
                orderBy: { recordedAt: 'asc' }
            });
            const skillHistoryData = skillHistory.map(record => ({
                date: record.recordedAt.toISOString(),
                spSkillPoint: record.totalFlareSkillSp,
                dpSkillPoint: record.totalFlareSkillDp
            }));

            const playerStats: PlayerStats = {
                createdAt: player.createdAt.toISOString(),
                updatedAt: player.updatedAt.toISOString(),
                SP: {
                    totalFlareSkill: player.totalFlareSkillSp,
                    grade: this.calculateGrade(player.totalFlareSkillSp)
                },
                DP: {
                    totalFlareSkill: player.totalFlareSkillDp,
                    grade: this.calculateGrade(player.totalFlareSkillDp)
                },
                skillHistory: skillHistoryData
            };

            return playerStats;
        } catch (error) {
            console.error(`Error fetching stats for player ${playerName}:`, error);
            throw error;
        }
    }

    private calculateGrade(totalFlareSkill: number): string {

        if (totalFlareSkill >= 90000) return 'WORLD';
        if (totalFlareSkill >= 86250) return 'SUN+++';
        if (totalFlareSkill >= 82500) return 'SUN++';
        if (totalFlareSkill >= 78750) return 'SUN+';
        if (totalFlareSkill >= 75000) return 'SUN';
        if (totalFlareSkill >= 71250) return 'NEPTUNE+++';
        if (totalFlareSkill >= 67500) return 'NEPTUNE++';
        if (totalFlareSkill >= 63750) return 'NEPTUNE+';
        if (totalFlareSkill >= 60000) return 'NEPTUNE';
        if (totalFlareSkill >= 56250) return 'URANUS+++';
        if (totalFlareSkill >= 52500) return 'URANUS++';
        if (totalFlareSkill >= 48750) return 'URANUS+';
        if (totalFlareSkill >= 45000) return 'URANUS';
        if (totalFlareSkill >= 42250) return 'SATURN+++';
        if (totalFlareSkill >= 39500) return 'SATURN++';
        if (totalFlareSkill >= 36750) return 'SATURN+';
        if (totalFlareSkill >= 34000) return 'SATURN';
        if (totalFlareSkill >= 31500) return 'JUPITER+++';
        if (totalFlareSkill >= 29000) return 'JUPITER++';
        if (totalFlareSkill >= 26500) return 'JUPITER+';
        if (totalFlareSkill >= 24000) return 'JUPITER';
        if (totalFlareSkill >= 22000) return 'MARS+++';
        if (totalFlareSkill >= 20000) return 'MARS++';
        if (totalFlareSkill >= 18000) return 'MARS+';
        if (totalFlareSkill >= 16000) return 'MARS';
        if (totalFlareSkill >= 14500) return 'EARTH+++';
        if (totalFlareSkill >= 13000) return 'EARTH++';
        if (totalFlareSkill >= 11500) return 'EARTH+';
        if (totalFlareSkill >= 10000) return 'EARTH';
        if (totalFlareSkill >= 9000) return 'VENUS+++';
        if (totalFlareSkill >= 8000) return 'VENUS++';
        if (totalFlareSkill >= 7000) return 'VENUS+';
        if (totalFlareSkill >= 6000) return 'VENUS';
        if (totalFlareSkill >= 5000) return 'MERCURY+++';
        if (totalFlareSkill >= 4000) return 'MERCURY++';
        if (totalFlareSkill >= 3000) return 'MERCURY+';
        if (totalFlareSkill >= 2000) return 'MERCURY';
        if (totalFlareSkill >= 1500) return 'NONE+++';
        if (totalFlareSkill >= 1000) return 'NONE++';
        if (totalFlareSkill >= 500) return 'NONE+';
        return 'NONE';
    }
}