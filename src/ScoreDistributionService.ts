import prisma from "./db"

interface ScoreDistribution {
    minScore: number;
    maxScore: number;
    distribution: Array<{ scoreLowerBound: number; count: number }>;
}

export class ScoreDsitrbutionService {

    private readonly THEORETICAL_MAX_SCORE = 1000000;
    private readonly DEFAULT_SCORE_INTERVAL = 2000;

    async getDistribution(songId: number, chartType: string, flareRank: string): Promise<ScoreDistribution> {
        // データベースからスコアを取得
        const scores = await prisma.playerScore.findMany({
            where: {
                songId: songId,
                chartType: chartType,
                flareRank: flareRank
            },
            select: {
                score: true
            }
        })

        if (scores.length === 0) {
            return {
                minScore: 0,
                maxScore: 0,
                distribution: []
            }
        }

        // 最小スコアと最大スコアを計算
        const minScore = Math.max(0, Math.min(...scores.map(s => s.score)))
        const maxScore = Math.min(this.THEORETICAL_MAX_SCORE, Math.max(...scores.map(s => s.score)))

        // スコアの範囲を定義（2000点刻み、最大値は計算された最大スコア）
        const scoreRanges: number[] = []
        for (let score = minScore; score <= maxScore; score += this.DEFAULT_SCORE_INTERVAL) {
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

        return {
            minScore,
            maxScore,
            distribution
        }
    }
}