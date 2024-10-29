import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePlayerSkillHistory() {
    try {
        // 全プレイヤーのデータを取得
        const players = await prisma.player.findMany({
            select: {
                id: true,
                totalFlareSkillSp: true,
                totalFlareSkillDp: true,
                updatedAt: true
            }
        });

        console.log(`Found ${players.length} players to migrate`);

        // 各プレイヤーの履歴データを作成
        const migrationPromises = players.map(player =>
            prisma.playerSkillHistory.create({
                data: {
                    playerId: player.id,
                    totalFlareSkillSp: player.totalFlareSkillSp,
                    totalFlareSkillDp: player.totalFlareSkillDp,
                    recordedAt: player.updatedAt // 最終更新日時を使用
                }
            })
        );

        // 一括でデータを作成
        const results = await prisma.$transaction(migrationPromises);

        console.log(`Successfully migrated ${results.length} player histories`);

        return {
            success: true,
            migratedCount: results.length
        };
    } catch (error) {
        console.error('Migration failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    } finally {
        await prisma.$disconnect();
    }
}

// スクリプトを実行
migratePlayerSkillHistory()
    .then(result => {
        console.log('Migration completed:', result);
        process.exit(0);
    })
    .catch(error => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });