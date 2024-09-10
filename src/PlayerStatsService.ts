import { PrismaClient, PlayerScore, Song } from '@prisma/client';

const prisma = new PrismaClient();

export interface Stats {
    totalFlareSkill: number;
    grade: string;
}

export interface PlayerStats {
    SP: Stats;
    DP: Stats;
}

export class PlayerStatsService {
    async getPlayerStats(playerName: string): Promise<PlayerStats | null> {
        try {
            const player = await prisma.player.findUnique({ where: { name: playerName } });
            if (!player) {
                console.log(`Player not found: ${playerName}`);
                return null;
            }

            const playerStats: PlayerStats = {
                SP: {
                    totalFlareSkill: player.totalFlareSkillSp,
                    grade: this.calculateGrade(player.totalFlareSkillSp)
                },
                DP: {
                    totalFlareSkill: player.totalFlareSkillDp,
                    grade: this.calculateGrade(player.totalFlareSkillDp)
                }
            };

            return playerStats;
        } catch (error) {
            console.error(`Error fetching stats for player ${playerName}:`, error);
            throw error;
        }
    }

    private calculateGrade(totalFlareSkill: number): string {
        // ここにグレード計算ロジックを実装
        // 例：
        if (totalFlareSkill >= 1000) return 'S';
        if (totalFlareSkill >= 800) return 'A';
        if (totalFlareSkill >= 600) return 'B';
        if (totalFlareSkill >= 400) return 'C';
        return 'D';
    }
}