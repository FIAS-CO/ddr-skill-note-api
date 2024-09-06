import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
    return c.json({ message: 'Hello from DDR API!' })
})

app.get('/api/health', (c) => {
    return c.json({ status: 'OK', timestamp: new Date().toISOString() })
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
    fetch: app.fetch,
    port
})