const { query } = require('../config/db')

const seedMenus = [
  {
    name: '아메리카노(ICE)',
    description: '가볍고 산뜻한 아이스 아메리카노',
    price: 4000,
    imageKey: 'americano-ice',
    stockQuantity: 10,
  },
  {
    name: '아메리카노(HOT)',
    description: '진한 향을 담은 따뜻한 아메리카노',
    price: 4000,
    imageKey: 'americano-hot',
    stockQuantity: 10,
  },
  {
    name: '카페라떼',
    description: '주인장 Yoob의 원픽 라떼',
    price: 5000,
    imageKey: 'caffe-latte',
    stockQuantity: 10,
  },
]

const seedOptions = [
  { name: '샷 추가', price: 500 },
  { name: '시럽 추가', price: 0 },
]

async function ensureSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS menus (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      image_key VARCHAR(120) NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS options (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE,
      price INTEGER NOT NULL CHECK (price >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS menu_options (
      menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
      option_id INTEGER NOT NULL REFERENCES options(id) ON DELETE CASCADE,
      PRIMARY KEY (menu_id, option_id)
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status VARCHAR(40) NOT NULL DEFAULT '주문 접수',
      total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_id INTEGER NOT NULL REFERENCES menus(id),
      menu_name_snapshot VARCHAR(120) NOT NULL,
      base_price_snapshot INTEGER NOT NULL CHECK (base_price_snapshot >= 0),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      line_total INTEGER NOT NULL CHECK (line_total >= 0)
    );
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS order_item_options (
      id SERIAL PRIMARY KEY,
      order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      option_id INTEGER NOT NULL REFERENCES options(id),
      option_name_snapshot VARCHAR(120) NOT NULL,
      option_price_snapshot INTEGER NOT NULL CHECK (option_price_snapshot >= 0)
    );
  `)
}

async function ensureSeedData() {
  const menuCountResult = await query('SELECT COUNT(*)::int AS count FROM menus')
  const menuCount = menuCountResult.rows[0].count

  if (menuCount === 0) {
    for (const menu of seedMenus) {
      await query(
        `
          INSERT INTO menus (name, description, price, image_key, stock_quantity)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [menu.name, menu.description, menu.price, menu.imageKey, menu.stockQuantity],
      )
    }
  }

  for (const option of seedOptions) {
    await query(
      `
        INSERT INTO options (name, price)
        VALUES ($1, $2)
        ON CONFLICT (name) DO UPDATE
        SET price = EXCLUDED.price,
            updated_at = NOW()
      `,
      [option.name, option.price],
    )
  }

  const menus = await query('SELECT id FROM menus')
  const options = await query('SELECT id FROM options')

  for (const menu of menus.rows) {
    for (const option of options.rows) {
      await query(
        `
          INSERT INTO menu_options (menu_id, option_id)
          VALUES ($1, $2)
          ON CONFLICT (menu_id, option_id) DO NOTHING
        `,
        [menu.id, option.id],
      )
    }
  }
}

async function initDb() {
  await ensureSchema()
  await ensureSeedData()
}

module.exports = {
  initDb,
}
