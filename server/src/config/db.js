const { Pool } = require('pg')

function getDatabaseUrl() {
  return process.env.DATABASE_URL
}

const pool = new Pool({
  get connectionString() {
    return getDatabaseUrl()
  },
})

async function testDbConnection() {
  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  const client = await pool.connect()
  try {
    await client.query('SELECT 1')
  } finally {
    client.release()
  }
}

module.exports = {
  pool,
  testDbConnection,
}
