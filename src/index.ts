import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import prisma from './db'

const app = new Hono()

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
app.post('/api/users', async (c) => {
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

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
    fetch: app.fetch,
    port
})