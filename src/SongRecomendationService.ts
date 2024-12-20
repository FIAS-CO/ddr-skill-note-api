import { PrismaClient, PlayerScore, Song } from '@prisma/client';
import { ChartType, FlareRank } from './types/Types';
import { convertToDisplayFlareRank } from './util/DdrDefinitionUtil';

const prisma = new PrismaClient();

export interface RecommendedSong {
    songId: number;
    title: string;
    level: number;
    chartType: string;
    flareRank: FlareRank;
    count: number; // この曲をスキル対象にしているプレイヤーの数
    percentage: number; // 全体の中での割合
}

export class SongRecommendationService {
    async getRecommendations(
        songId: number,
        chartType: ChartType,
        flareRank: string,
        limit: number = 1568
    ): Promise<RecommendedSong[]> {
        // 1. まず、指定された曲・譜面・フレアランクでクリアしたプレイヤーのIDを取得
        const targetPlayers = await prisma.playerScore.findMany({
            where: {
                songId: songId,
                chartType: chartType,
                flareRank: flareRank
            },
            select: {
                playerId: true
            }
        });
        targetPlayers.forEach(element => {
            console.log(`${element.playerId}`)
        });

        const playerIds = targetPlayers.map(p => p.playerId);
        const totalPlayersCount = playerIds.length;

        console.log(totalPlayersCount)
        if (totalPlayersCount === 0) {
            return [];
        }

        // 2. それらのプレイヤーの他のスキル対象曲を集計
        const otherScores = await prisma.playerScore.findMany({
            where: {
                playerId: {
                    in: playerIds
                },
                NOT: {
                    AND: {
                        songId: songId,
                        chartType: chartType,
                        flareRank: flareRank
                    }
                }
            },
            include: {
                song: true
            }
        });


        console.log("d" + otherScores.length)

        // 3. 集計結果を集計・ソート
        const scoreGroups = otherScores.reduce((acc, score) => {
            const key = `${score.songId}-${score.chartType}-${score.flareRank}`;
            if (!acc[key]) {
                acc[key] = {
                    songId: score.songId,
                    title: score.song.title,
                    level: this.getLevelFromChartType(score.song, score.chartType),
                    chartType: score.chartType,
                    flareRank: convertToDisplayFlareRank(score.flareRank),
                    count: 0,
                    percentage: 0
                };
            }
            acc[key].count++;
            acc[key].percentage = (acc[key].count / totalPlayersCount) * 100;
            return acc;
        }, {} as { [key: string]: RecommendedSong });
        console.log("aa" + Object.values(scoreGroups).length)
        // 4. 結果を配列に変換してソート
        return Object.values(scoreGroups)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
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