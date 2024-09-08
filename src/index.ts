import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import prisma from './db'
import { getSheetData } from './spreadsheet/sheet'
import { updateSongsFromSheet } from './spreadsheet/songService'

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
app.get('/api/users/:id', async (c) => {
    const id = c.req.param('id')
    try {
        const user = await prisma.player.findUnique({
            where: { id }
        })
        if (!user) {
            return c.json({ error: 'User not found' }, 404)
        }
        return c.json(user)
    } catch (error) {
        console.error(error)
        return c.json({ error: 'Failed to fetch user' }, 500)
    }
})

// 新しいユーザーを作成
app.post('/api/create-user', async (c) => {
    const body = await c.req.json()
    try {
        const newUser = await prisma.player.create({
            data: {
                name: body.name,
                totalFlareSkillSp: body.totalFlareSkillSp,
                totalFlareSkillDp: body.totalFlareSkillDp
            }
        })
        return c.json(newUser, 201)
    } catch (error) {
        console.error(error)
        return c.json({
            error: 'Failed to create user',
            detail: error
        }, 500)
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
