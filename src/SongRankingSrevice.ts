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
    title: string;
    level: number;
    flareRank: string;
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
            include: { song: true }
        })

        const rankingSongs: RankingSongsSpDp = {
            SP: { CLASSIC: [], WHITE: [], GOLD: [] },
            DP: { CLASSIC: [], WHITE: [], GOLD: [] }
        }

        scores.forEach(score => {
            const playStyle = score.spdp as PlayStyle;
            const category = score.category as Category;
            const data = this.transformToRankingSong(score);

            console.log(`${playStyle}/${category}/${data}`)
            rankingSongs[playStyle][category].push(data);
        });

        return rankingSongs;
    }

    private convertToPlayStyle(value: string): PlayStyle {
        if (value === 'SP' || value === 'DP') {
            return value;
        }
        console.warn(`Invalid PlayStyle: ${value}. Defaulting to 'SP'`);
        return 'SP';
    }

    private convertToCategory(value: string): Category {
        if (value === 'CLASSIC' || value === 'WHITE' || value === 'GOLD') {
            return value;
        }
        console.warn(`Invalid Category: ${value}. Defaulting to 'CLASSIC'`);
        return 'CLASSIC';
    }

    private transformToRankingSong(score: Ranking & { song: Song }): RankingSong {
        return {
            title: score.song.title,
            level: this.getLevelFromChartType(score.song, score.chartType),
            flareRank: score.flareRank,
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