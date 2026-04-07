const { Pool } = require('pg')

function getDatabaseUrl() {
  return process.env.DATABASE_URL
}

let pool

async function query(text, params = []) {
  return getPool().query(text, params)
}

function getPool() {
  if (!pool) {
    const databaseUrl = getDatabaseUrl()
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set')
    }
    pool = new Pool({
      connectionString: databaseUrl,
    })
  }
  return pool
}

async function testDbConnection() {
  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }

  const client = await getPool().connect()
  try {
    await client.query('SELECT 1')
  } finally {
    client.release()
  }
}

module.exports = {
  getPool,
  query,
  testDbConnection,
}
