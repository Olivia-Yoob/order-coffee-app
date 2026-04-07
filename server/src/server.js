const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const apiRouter = require('./routes/api')
const { initDb } = require('./db/initDb')

dotenv.config()
const { testDbConnection } = require('./config/db')

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())
app.use('/api', apiRouter)

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Coffee ordering backend is running',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/health/db', async (req, res) => {
  try {
    await testDbConnection()
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: error.message,
      timestamp: new Date().toISOString(),
    })
  }
})

app.get('/', (req, res) => {
  res.status(200).json({
    service: 'COZY backend',
    docs_hint: 'Use /api/health to check server status.',
  })
})

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ message: 'Internal server error' })
})

async function startServer() {
  await initDb()
  await testDbConnection()

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})
