import { PrismaClient, Ranking, Song } from '@prisma/client';
import { ChartType, FlareRank } from './types/Types';
import { convertToDisplayFlareRank } from './util/DdrDefinitionUtil';

const prisma = new PrismaClient();

export interface RankingSongsSpDp {
    SP: RankingSongs;
    DP: RankingSongs;
}

interface CategoryData {
    songs: RankingSong[];
    totalCount: number;
}

export interface RankingSongs {
    CLASSIC: CategoryData;
    WHITE: CategoryData;
    GOLD: CategoryData;
}

export interface RankingSong {
    id: number;
    title: string;
    level: number;
    flareRank: string;
    chartType: string;
    overallPercentage: number;
}

export interface NominatedRanking {
    grade: string,
    flareRank: FlareRank,
    overallPercentage: number
}

type PlayStyle = keyof RankingSongsSpDp;
type Category = keyof RankingSongs;

export class SongRankingSrevice {
    async getRankedSongs(grade: string, page: number = 1): Promise<RankingSongsSpDp | null> {
        console.log(`grade:${grade}, page:${page}`)
        let uppercaseGrade = grade.toUpperCase();
        const scores = await prisma.ranking.findMany({
            where: { grade: uppercaseGrade },
            include: { song: true },
            orderBy: { overallPercentage: 'desc' }
        });

        const rankingSongs: RankingSongsSpDp = {
            SP: {
                CLASSIC: { songs: [], totalCount: 0 },
                WHITE: { songs: [], totalCount: 0 },
                GOLD: { songs: [], totalCount: 0 }
            },
            DP: {
                CLASSIC: { songs: [], totalCount: 0 },
                WHITE: { songs: [], totalCount: 0 },
                GOLD: { songs: [], totalCount: 0 }
            }
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

        const itemsPerPage = 50;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        // Process each group
        Object.entries(groupedScores).forEach(([key, scoreGroup]) => {
            const [playStyle, category] = key.split('-') as [PlayStyle, Category];
            rankingSongs[playStyle][category] = {
                songs: scoreGroup
                    .slice(startIndex, endIndex)
                    .map(score => this.transformToRankingSong(score)),
                totalCount: scoreGroup.length
            };
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

    async getNominatedRanking(songId: number, chartType: ChartType): Promise<NominatedRanking[]> {
        const validGrades = [
            'WORLD',
            'SUN+++', 'SUN++', 'SUN+', 'SUN',
            'NEPTUNE+++', 'NEPTUNE++', 'NEPTUNE+', 'NEPTUNE',
            'URANUS+++', 'URANUS++', 'URANUS+', 'URANUS'
        ];
        const results = await prisma.ranking.findMany({
            where: {
                songId: songId,
                chartType: chartType,
                grade: {
                    in: validGrades
                },
                overallPercentage: {
                    gte: 15
                }
            }
        })

        console.log(results)

        const nominatedRanking: NominatedRanking[] = results.map(r => ({
            grade: r.grade,
            flareRank: convertToDisplayFlareRank(r.flareRank),
            overallPercentage: r.overallPercentage
        }));

        return nominatedRanking;
    }
}