import { PrismaClient, Ranking, Song } from '@prisma/client';

const prisma = new PrismaClient();

export interface RankingSongsSpDp {
    SP: RankingSongs;
    DP: RankingSongs;
}

export interface RankingSongs {
    CLASSIC: RankingSong[];
    WHITE: RankingSong[];
    GOLD: RankingSong[];
}

export interface RankingSong {
    id: number;
    title: string;
    level: number;
    flareRank: string;
    chartType: string;
    overallPercentage: number;
}

type PlayStyle = keyof RankingSongsSpDp;
type Category = keyof RankingSongs;

export class SongRankingSrevice {
    async getRankedSongs(grade: string): Promise<RankingSongsSpDp | null> {
        console.log(`grade:${grade}`)
        let uppercaseGrade = grade.toUpperCase();
        const scores = await prisma.ranking.findMany({
            where: { grade: uppercaseGrade },
            include: { song: true },
            orderBy: { overallPercentage: 'desc' }
        });

        const rankingSongs: RankingSongsSpDp = {
            SP: { CLASSIC: [], WHITE: [], GOLD: [] },
            DP: { CLASSIC: [], WHITE: [], GOLD: [] }
        }

        // Group scores by playStyle and category
        const groupedScores: { [key: string]: (Ranking & { song: Song })[] } = {};
        scores.forEach(score => {
            const key = `${score.spdp}-${score.category}`;
            if (!groupedScores[key]) {
                groupedScores[key] = [];
            }
            groupedScores[key].push(score);
        });

        // Process each group
        Object.entries(groupedScores).forEach(([key, scoreGroup]) => {
            const [playStyle, category] = key.split('-') as [PlayStyle, Category];
            rankingSongs[playStyle][category] = scoreGroup
                .slice(0, 50)
                .map(score => this.transformToRankingSong(score));
        });

        return rankingSongs;
    }

    private transformToRankingSong(score: Ranking & { song: Song }): RankingSong {
        return {
            id: score.song.id,
            title: score.song.title,
            level: this.getLevelFromChartType(score.song, score.chartType),
            flareRank: score.flareRank,
            chartType: score.chartType.toUpperCase(),
            overallPercentage: score.overallPercentage
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
}