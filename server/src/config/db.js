const { Pool } = require('pg')

function getDatabaseUrl() {
  return process.env.DATABASE_URL
}

let pool

function isTruthy(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

function isFalsy(value) {
  return ['0', 'false', 'no', 'off'].includes(String(value).toLowerCase())
}

function shouldUseSsl(databaseUrl) {
  if (process.env.DB_SSL !== undefined) {
    if (isTruthy(process.env.DB_SSL)) return true
    if (isFalsy(process.env.DB_SSL)) return false
  }

  if (process.env.NODE_ENV === 'production') {
    return true
  }

  try {
    const parsed = new URL(databaseUrl)
    const sslMode = parsed.searchParams.get('sslmode')
    if (sslMode === 'require') return true
    if (sslMode === 'disable') return false
    return parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1'
  } catch {
    return false
  }
}

function getConnectionConfig() {
  const databaseUrl = getDatabaseUrl()
  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : false,
    }
  }

  const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env
  if (!DB_HOST || !DB_NAME || !DB_USER) {
    throw new Error(
      'DATABASE_URL is not set. Or set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.',
    )
  }

  const plainConnection = `postgresql://${DB_USER}:${DB_PASSWORD || ''}@${DB_HOST}:${DB_PORT || '5432'}/${DB_NAME}`
  return {
    host: DB_HOST,
    port: Number(DB_PORT || 5432),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD,
    ssl: shouldUseSsl(plainConnection) ? { rejectUnauthorized: false } : false,
  }
}

async function query(text, params = []) {
  return getPool().query(text, params)
}

function getPool() {
  if (!pool) {
    pool = new Pool(getConnectionConfig())
  }
  return pool
}

async function testDbConnection() {
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
