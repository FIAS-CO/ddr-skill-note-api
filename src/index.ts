import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import prisma from './db'
import { getSheetData } from './spreadsheet/sheet'
import { updateSongsFromSheet } from './spreadsheet/songService'
import { Prisma } from '@prisma/client'
import { PlayerScoresService } from './PlayerScoreService'
import { PlayerStatsService } from './PlayerStatsService'
import { SongRankingSrevice } from './SongRankingSrevice'

const app = new Hono()

const isDevelopment = process.env.NODE_ENV === 'development'

// 環境に応じた設定を選択
const allowAnyOrigin = isDevelopment
    ? process.env.DEV_ALLOW_ANY_ORIGIN === 'true'
    : process.env.PROD_ALLOW_ANY_ORIGIN === 'true'

const allowedOrigins = isDevelopment
    ? process.env.DEV_ALLOWED_ORIGINS?.split(',') || []
    : process.env.PROD_ALLOWED_ORIGINS?.split(',') || []

// Hono内蔵のCORSミドルウェアを追加
app.use('*', cors({
    origin: (origin) => {
        return allowAnyOrigin || allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
}))

// ルート処理
app.get('/', (c) => {
    return c.json({ message: 'Hello from DDR API!' })
})

app.get('/api/health', (c) => {
    return c.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// ユーザー一覧を取得
app.get('/api/users', async (c) => {
    try {
        const users = await prisma.player.findMany()
        return c.json(users)
    } catch (error) {
        console.error(error)
        return c.json({ error: 'Failed to fetch users' }, 500)
    }
})

// 最近のユーザー一覧を取得
app.get('/api/recent_users', async (c) => {
    try {
        const users = await prisma.player.findMany({
            take: 30,
            orderBy: {
                updatedAt: 'desc'
            }
        })
        return c.json(users)
    } catch (error) {
        console.error('Error fetching recent users:', error)
        return c.json({ error: 'Failed to fetch recent users' }, 500)
    }
})

// 特定のユーザーを取得
app.get('/api/get-player-stat/:userId', async (c) => {
    const userId = c.req.param('userId');
    try {
        const stats = await new PlayerStatsService().getPlayerStats(userId);
        if (stats === null) {
            return c.json({ error: 'Player not found' }, 404);
        }
        return c.json(stats);
    } catch (error) {
        console.error('Error fetching player stats:', error);
        return c.json({ error: 'Failed to fetch player stats' }, 500);
    }
});


// 新しいユーザーを作成
app.post('/api/create-user', async (c) => {
    const body = await c.req.json()
    try {
        const newUser = await prisma.player.create({
            data: {
                name: body.name,
                totalFlareSkillSp: 0,
                totalFlareSkillDp: 0
            }
        })
        return c.json(newUser, 201)
    } catch (error) {
        console.error(error)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                // Unique constraint failed on the `name` field
                return c.json({
                    error: 'A user with this name already exists. Please choose a different name.'
                }, 400)
            }
        }
        // その他のエラー
        console.error(error)
        return c.json({
            error: 'Failed to create user',
            detail: error
        }, 500)
    }
})

app.post('api/delete-user', async (c) => {
    console.log('api/delete-user')
    try {
        const body = await c.req.json()
        if (!body.id) {
            return c.json({ error: 'no user found.' }, 400);
        }

        const result = await prisma.$transaction(async (prisma) => {

            await prisma.playerScore.deleteMany({
                where: { playerId: body.id }
            })
            const deleteUser = await prisma.player.delete({
                where: { id: body.id }
            })

            return deleteUser.name
        });

        return c.json({
            user: result,
            message: 'Delete user successfully',
        }, 200);
    } catch (error) {
        console.error('Error removing user:', error);
        return c.json({
            error: 'Failed to remove user',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
})

app.get('/api/update-songs', async (c) => {
    try {
        const spreadsheetId = '1HA8RH2ozKQTPvvq2BVcVoOSEMVIldRw89tFtNg8Z4V8';
        const range = 'MusicNames!A1:O1500';  // 1500行まで取得
        const sheetData = await getSheetData(spreadsheetId, range);

        if (!sheetData || !Array.isArray(sheetData) || sheetData.length === 0) {
            return c.json({ error: 'No data received from the spreadsheet' }, 400);
        }

        const insertedCount = await updateSongsFromSheet(sheetData);

        return c.json({
            message: 'Songs updated successfully',
            insertedCount: insertedCount,
            totalRows: sheetData.length
        }, 200);
    } catch (error) {
        console.error('Error updating songs:', error);
        return c.json({
            error: 'Failed to update songs',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
})

app.post('/api/player-scores', async (c) => {
    const body = await c.req.json();
    if (!body.playerId ||
        typeof body.totalFlareSkillSp !== 'number' ||
        typeof body.totalFlareSkillDp !== 'number' ||
        !Array.isArray(body.scores) ||
        body.scores.length === 0) {
        console.error(body);
        return c.json({ error: 'Invalid input: expected playerId, totalFlareSkillSp, totalFlareSkillDp, and a non-empty scores array' }, 400);
    }
    const { playerId, totalFlareSkillSp, totalFlareSkillDp, scores } = body;

    interface ScoreData {
        songId: number;
        chartType: string;
        score: number;
        flareRank: string;
        flareSkill: number;
        songName: string;
        category: string;
        playStyle: string;
    }

    try {
        // プレイヤーの存在確認
        const existingPlayer = await prisma.player.findUnique({
            where: { id: playerId }
        });

        if (!existingPlayer) {
            return c.json({ error: 'Player not found' }, 404);
        }

        const result = await prisma.$transaction(async (prisma) => {
            // Playerテーブルの更新
            await prisma.player.update({
                where: { id: playerId },
                data: {
                    totalFlareSkillSp: totalFlareSkillSp,
                    totalFlareSkillDp: totalFlareSkillDp,
                    updatedAt: new Date() // updatedAtを明示的に更新
                }
            });

            // 指定されたplayerIdの既存のスコアをすべて削除
            await prisma.playerScore.deleteMany({
                where: { playerId: playerId }
            });

            // 新しいスコアデータをすべて挿入
            const createdScores = await prisma.playerScore.createMany({
                data: scores.map((score: ScoreData) => ({
                    playerId: playerId,
                    songId: score.songId,
                    chartType: score.chartType,
                    score: score.score,
                    flareRank: score.flareRank,
                    flareSkill: score.flareSkill
                })),
                skipDuplicates: true
            });

            return createdScores;
        });

        return c.json({
            message: 'Player data and scores updated successfully',
            scoresUpdated: result.count
        }, 200);

    } catch (error) {
        console.error('Error updating player data and scores:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2003') {
                return c.json({ error: 'Foreign key constraint failed. Ensure that all songIds exist.' }, 400);
            }
        }
        console.error('UUID:', playerId);
        return c.json({
            error: 'Failed to update player data and scores',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

app.get('/api/get-player-scores/:name', async (c) => {
    const playerName = c.req.param('name');
    console.log(`get-player-scores/ ${playerName}`)
    try {
        const categorizedScores = await new PlayerScoresService().getPlayerScores(playerName);
        if (categorizedScores === null) {
            return c.json({ error: 'Player not found' }, 404);
        }
        return c.json(categorizedScores);
    } catch (error) {
        console.error('Error fetching player scores:', error);
        return c.json({ error: 'Failed to fetch player scores' }, 500);
    }
});

interface RankingBaseData {
    songId: number;
    category: string;
    chartType: string;
    grade: string;
    spdp: 'SP' | 'DP';
    players_played: number;
    total_players: number;
    flareRank: string;
}

app.get('/api/update-rankings', async (c) => {
    try {
        const baseData = await prisma.$queryRaw<RankingBaseData[]>`SELECT * FROM ranking_base_data`;
        const rankings = processRankings(baseData);

        await prisma.$transaction([
            prisma.ranking.deleteMany({}),
            ...rankings.map(ranking =>
                prisma.ranking.create({ data: ranking })
            )
        ]);

        return c.json({ message: 'Rankings updated successfully', count: rankings.length });
    } catch (error) {
        console.error('Error updating rankings:', error);
        return c.json({ error: 'Failed to update rankings', details: (error as Error).message }, 500);
    }
});

function processRankings(baseData: RankingBaseData[]): Prisma.RankingCreateInput[] {
    return baseData.map(data => {
        const { songId, category, chartType, grade, spdp, players_played, total_players, flareRank } = data;
        const overallPercentage = (players_played / total_players) * 100;

        return {
            song: { connect: { id: songId } }, // Songモデルとの関連付け
            grade,
            category,
            chartType,
            spdp,
            flareRank,
            overallPercentage
        };
    });
}

app.get('/api/ranking-songs/:grade', async (c) => {
    const grade = c.req.param('grade');
    console.log(`/api/ranking-songs/${grade}`)
    try {
        const categorizedScores = await new SongRankingSrevice().getRankedSongs(grade);
        if (categorizedScores === null) {
            return c.json({ error: 'not found' }, 404);
        }
        return c.json(categorizedScores);
    } catch (error) {
        console.error('Error fetching player scores:', error);
        return c.json({ error: 'Failed to fetch player scores' }, 500);
    }
});

app.get('/api/songs/:songId/min-scores', async (c) => {
    const songId = parseInt(c.req.param('songId'))
    if (isNaN(songId)) {
        return c.json({ error: 'Invalid songId' }, 400)
    }

    try {
        const scores = await prisma.playerScore.groupBy({
            by: ['flareRank'],
            where: {
                songId: songId
            },
            _min: {
                score: true
            }
        })

        const result: { [key: string]: number | string } = {}
        for (let i = 1; i <= 10; i++) {
            result[i.toString()] = "no value"
        }

        scores.forEach(score => {
            if (score._min.score !== null) {
                result[score.flareRank] = score._min.score
            }
        })

        return c.json(result)
    } catch (error) {
        console.error('Error fetching min scores by flare rank:', error)
        return c.json({ error: 'Failed to fetch min scores' }, 500)
    }
})

app.get('/api/songs/:songId/min-scores/:flareRank', async (c) => {
    const songId = parseInt(c.req.param('songId'))
    const flareRank = c.req.param('flareRank')

    if (isNaN(songId)) {
        return c.json({ error: 'Invalid songId' }, 400)
    }

    if (!['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].includes(flareRank)) {
        return c.json({ error: 'Invalid flareRank' }, 400)
    }

    try {
        const score = await prisma.playerScore.findFirst({
            where: {
                songId: songId,
                flareRank: flareRank
            },
            orderBy: {
                score: 'asc'
            },
            select: {
                score: true
            }
        })

        return c.json({
            [flareRank]: score ? score.score : "no value"
        })
    } catch (error) {
        console.error('Error fetching min score for specific flare rank:', error)
        return c.json({ error: 'Failed to fetch min score' }, 500)
    }
})

interface ScoreDistribution {
    minScore: number;
    maxScore: number;
    distribution: Array<{ scoreLowerBound: number; count: number }>;
}

interface ScoreDistributionResult {
    songId: number;
    chartType: string;
    scoreDistributions: {
        EX: ScoreDistribution;
        IX: ScoreDistribution;
    };
}

app.get('/api/songs/:songId/score-distribution/:chartType', async (c) => {
    const songId = parseInt(c.req.param('songId'))
    const chartType = c.req.param('chartType') // 例: 'ESP', 'CDP'等

    if (isNaN(songId)) {
        return c.json({ error: 'Invalid songId' }, 400)
    }

    if (!['BSP', 'DSP', 'ESP', 'CSP', 'BDP', 'DDP', 'EDP', 'CDP'].includes(chartType)) {
        return c.json({ error: 'Invalid chartType' }, 400)
    }

    const flareRanks = ['EX', 'IX']
    const SCORE_INTERVAL = 2000
    const THEORETICAL_MAX_SCORE = 1000000 // 理論上の最大スコア

    try {
        const result: ScoreDistributionResult = {
            songId,
            chartType,
            scoreDistributions: {} as { EX: ScoreDistribution; IX: ScoreDistribution }
        }

        for (const flareRank of flareRanks) {
            // データベースからスコアを取得
            const scores = await prisma.playerScore.findMany({
                where: {
                    songId: songId,
                    chartType: chartType,
                    flareRank: flareRank === 'EX' ? '10' : '9' // データベースでの表現に合わせる
                },
                select: {
                    score: true
                }
            })

            if (scores.length === 0) {
                result.scoreDistributions[flareRank as 'EX' | 'IX'] = { error: 'No scores found' } as any
                continue
            }

            // 最小スコアと最大スコアを計算
            const minScore = Math.max(0, Math.min(...scores.map(s => s.score)))
            const maxScore = Math.min(THEORETICAL_MAX_SCORE, Math.max(...scores.map(s => s.score)))

            // スコアの範囲を定義（2000点刻み、最大値は計算された最大スコア）
            const scoreRanges: number[] = []
            for (let score = minScore; score <= maxScore; score += SCORE_INTERVAL) {
                scoreRanges.push(score)
            }
            if (scoreRanges[scoreRanges.length - 1] !== maxScore) {
                scoreRanges.push(maxScore)
            }

            // スコア分布データを作成
            const distribution = scoreRanges.map((scoreLowerBound, index) => {
                const upperBound = index < scoreRanges.length - 1 ? scoreRanges[index + 1] : maxScore + 1
                const count = scores.filter(s => s.score >= scoreLowerBound && s.score < upperBound).length
                return { scoreLowerBound, count }
            })

            result.scoreDistributions[flareRank as 'EX' | 'IX'] = {
                minScore,
                maxScore,
                distribution
            }
        }

        return c.json(result)
    } catch (error) {
        console.error('Error fetching score distribution:', error)
        return c.json({ error: 'Failed to fetch score distribution' }, 500)
    }
})

app.use('*', async (c, next) => {
    console.log(`${c.req.method} ${c.req.url}`);
    await next();
});

const port = 3000
console.log(`Server is running on port ${port}`)
console.log('Registered routes:', app.routes.map(r => `${r.method} ${r.path}`));
serve({
    fetch: app.fetch,
    port
})
