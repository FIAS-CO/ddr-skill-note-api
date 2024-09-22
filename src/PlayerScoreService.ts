import { PrismaClient, PlayerScore, Song } from '@prisma/client';

const prisma = new PrismaClient();

export interface CategorizedSongs {
    SP: PlayStyle;
    DP: PlayStyle;
}

export interface PlayStyle {
    CLASSIC: SkillBookSong[];
    WHITE: SkillBookSong[];
    GOLD: SkillBookSong[];
}

export interface SkillBookSong {
    title: string;
    score: number;
    level: number;
    chartType: string;
    flareRank: string;
    flareSkill: number;
}


export class PlayerScoresService {
    async getPlayerScores(playerName: string): Promise<CategorizedSongs | null> {
        try {
            const player = await prisma.player.findUnique({ where: { name: playerName } });
            if (!player) {
                console.log(`Player not found: ${playerName}`);
                return null;
            }

            const playerScores = await prisma.playerScore.findMany({
                where: { playerId: player.id },
                include: { song: true }
            });

            const categorizedSongs: CategorizedSongs = {
                SP: { CLASSIC: [], WHITE: [], GOLD: [] },
                DP: { CLASSIC: [], WHITE: [], GOLD: [] }
            };

            playerScores.forEach(score => {
                const songData = this.transformToSkillBookSong(score);
                const playStyle = score.chartType.endsWith('DP') ? 'DP' : 'SP';
                const category = this.getSongCategory(score.song);

                categorizedSongs[playStyle][category].push(songData);
            });

            return categorizedSongs;
        } catch (error) {
            console.error(`Error fetching scores for player ${playerName}:`, error);
            throw error;
        }
    }

    private transformToSkillBookSong(score: PlayerScore & { song: Song }): SkillBookSong {
        return {
            title: score.song.title,
            level: this.getLevelFromChartType(score.song, score.chartType),
            flareRank: score.flareRank,
            chartType: score.chartType.toUpperCase(),
            score: score.score,
            flareSkill: score.flareSkill
        };
    }

    private getLevelFromChartType(song: Song, chartType: string): number {
        switch (chartType) {
            case 'BSP': return song.bSp;
            case 'DSP': return song.dSp;
            case 'ESP': return song.eSp;
            case 'CSP': return song.cSp;
            case 'BDP': return song.bDp;
            case 'DDP': return song.dDp;
            case 'EDP': return song.eDp;
            case 'CDP': return song.cDp;
            default: return 0;
        }
    }

    private getSongCategory(song: Song): 'CLASSIC' | 'WHITE' | 'GOLD' {
        const VERSION_CATEGORY_MAP: { [key: string]: 'CLASSIC' | 'WHITE' | 'GOLD' } = {
            '1st': 'CLASSIC',
            '2nd': 'CLASSIC',
            '3rd': 'CLASSIC',
            '4th': 'CLASSIC',
            '5th': 'CLASSIC',
            '6th': 'CLASSIC',
            '7th': 'CLASSIC',
            '8th': 'CLASSIC',
            '9th': 'CLASSIC',
            '10th': 'CLASSIC',
            'X': 'CLASSIC',
            'X2': 'CLASSIC',
            'X3': 'CLASSIC',
            '2013': 'WHITE',
            '2014': 'WHITE',
            'A': 'WHITE',
            'A20': 'GOLD',
            'A20 PLUS': 'GOLD',
            'A3': 'GOLD',
            'WORLD': 'GOLD'
        };

        return VERSION_CATEGORY_MAP[song.version] || 'CLASSIC';
    }
}