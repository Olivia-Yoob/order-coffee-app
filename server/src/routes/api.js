const express = require('express')
const { getPool, query } = require('../config/db')

const router = express.Router()

async function getMenusWithOptions() {
  const result = await query(`
    SELECT
      m.id,
      m.name,
      m.description,
      m.price,
      m.image_key,
      m.stock_quantity,
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', o.id,
            'name', o.name,
            'price', o.price
          )
          ORDER BY o.id
        ) FILTER (WHERE o.id IS NOT NULL),
        '[]'::json
      ) AS options
    FROM menus m
    LEFT JOIN menu_options mo ON mo.menu_id = m.id
    LEFT JOIN options o ON o.id = mo.option_id
    WHERE m.is_active = TRUE
    GROUP BY m.id
    ORDER BY m.id
  `)

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    imageKey: row.image_key,
    stockQuantity: row.stock_quantity,
    options: row.options,
  }))
}

router.get('/menus', async (req, res, next) => {
  try {
    const menus = await getMenusWithOptions()
    res.status(200).json({ menus })
  } catch (error) {
    next(error)
  }
})

router.get('/admin/orders', async (req, res, next) => {
  try {
    const result = await query(
      `
      SELECT id, ordered_at, status, total_amount
      FROM orders
      ORDER BY ordered_at DESC, id DESC
      `,
    )

    const orderIds = result.rows.map((row) => row.id)
    const itemsByOrder = new Map()

    if (orderIds.length > 0) {
      const itemResult = await query(
        `
        SELECT
          oi.id,
          oi.order_id,
          oi.menu_name_snapshot,
          oi.quantity,
          oi.line_total,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', oio.option_id,
                'name', oio.option_name_snapshot,
                'price', oio.option_price_snapshot
              )
              ORDER BY oio.id
            ) FILTER (WHERE oio.id IS NOT NULL),
            '[]'::json
          ) AS options
        FROM order_items oi
        LEFT JOIN order_item_options oio ON oio.order_item_id = oi.id
        WHERE oi.order_id = ANY($1::int[])
        GROUP BY oi.id
        ORDER BY oi.id
        `,
        [orderIds],
      )

      for (const item of itemResult.rows) {
        const list = itemsByOrder.get(item.order_id) || []
        list.push({
          id: item.id,
          menuName: item.menu_name_snapshot,
          quantity: item.quantity,
          lineTotal: item.line_total,
          options: item.options,
        })
        itemsByOrder.set(item.order_id, list)
      }
    }

    const orders = result.rows.map((row) => ({
      id: row.id,
      orderedAt: row.ordered_at,
      status: row.status,
      totalAmount: row.total_amount,
      items: itemsByOrder.get(row.id) || [],
    }))

    res.status(200).json({ orders })
  } catch (error) {
    next(error)
  }
})

router.get('/orders/:orderId', async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId)
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid orderId' })
    }

    const headerResult = await query(
      `
      SELECT id, ordered_at, status, total_amount
      FROM orders
      WHERE id = $1
      `,
      [orderId],
    )

    if (headerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const itemResult = await query(
      `
      SELECT
        oi.id,
        oi.menu_name_snapshot,
        oi.quantity,
        oi.line_total,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', oio.option_id,
              'name', oio.option_name_snapshot,
              'price', oio.option_price_snapshot
            )
            ORDER BY oio.id
          ) FILTER (WHERE oio.id IS NOT NULL),
          '[]'::json
        ) AS options
      FROM order_items oi
      LEFT JOIN order_item_options oio ON oio.order_item_id = oi.id
      WHERE oi.order_id = $1
      GROUP BY oi.id
      ORDER BY oi.id
      `,
      [orderId],
    )

    const order = {
      id: headerResult.rows[0].id,
      orderedAt: headerResult.rows[0].ordered_at,
      status: headerResult.rows[0].status,
      totalAmount: headerResult.rows[0].total_amount,
      items: itemResult.rows.map((row) => ({
        id: row.id,
        menuName: row.menu_name_snapshot,
        quantity: row.quantity,
        lineTotal: row.line_total,
        options: row.options,
      })),
    }

    return res.status(200).json({ order })
  } catch (error) {
    next(error)
  }
})

router.patch('/admin/orders/:orderId/status', async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId)
    const { status } = req.body

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ message: 'Invalid orderId' })
    }

    if (!['제조 중', '완료'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' })
    }

    const result = await query(
      `
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
        AND (
          (status = '주문 접수' AND $1 = '제조 중')
          OR (status = '제조 중' AND $1 = '완료')
        )
      RETURNING id, ordered_at, status, total_amount
      `,
      [status, orderId],
    )

    if (result.rows.length === 0) {
      return res.status(409).json({
        message: 'Status transition is not allowed or order not found',
      })
    }

    return res.status(200).json({ order: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

router.patch('/admin/menus/:menuId/stock', async (req, res, next) => {
  try {
    const menuId = Number(req.params.menuId)
    const { diff } = req.body

    if (!Number.isInteger(menuId) || menuId <= 0) {
      return res.status(400).json({ message: 'Invalid menuId' })
    }
    if (!Number.isInteger(diff) || ![-1, 1].includes(diff)) {
      return res.status(400).json({ message: 'diff must be 1 or -1' })
    }

    const result = await query(
      `
      UPDATE menus
      SET stock_quantity = GREATEST(0, stock_quantity + $1),
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, stock_quantity
      `,
      [diff, menuId],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Menu not found' })
    }

    return res.status(200).json({
      menuId: result.rows[0].id,
      stockQuantity: result.rows[0].stock_quantity,
    })
  } catch (error) {
    next(error)
  }
})

router.post('/orders', async (req, res, next) => {
  const client = await getPool().connect()

  try {
    const { items } = req.body
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'items is required' })
    }

    await client.query('BEGIN')

    let totalAmount = 0
    const normalizedItems = []

    for (const inputItem of items) {
      const menuId = Number(inputItem.menuId)
      const quantity = Number(inputItem.quantity)
      const optionIds = Array.isArray(inputItem.optionIds)
        ? [...new Set(inputItem.optionIds.map(Number).filter(Number.isInteger))]
        : []

      if (!Number.isInteger(menuId) || menuId <= 0) {
        throw new Error('Invalid menuId')
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('Invalid quantity')
      }

      const menuResult = await client.query(
        `SELECT id, name, price, stock_quantity FROM menus WHERE id = $1 FOR UPDATE`,
        [menuId],
      )
      if (menuResult.rows.length === 0) {
        throw new Error(`Menu not found: ${menuId}`)
      }

      const menu = menuResult.rows[0]
      if (menu.stock_quantity < quantity) {
        throw new Error(`${menu.name} 재고가 부족합니다`)
      }

      let optionTotal = 0
      let optionRows = []

      if (optionIds.length > 0) {
        const optionResult = await client.query(
          `
          SELECT o.id, o.name, o.price
          FROM options o
          INNER JOIN menu_options mo
            ON mo.option_id = o.id AND mo.menu_id = $1
          WHERE o.id = ANY($2::int[])
          `,
          [menuId, optionIds],
        )

        if (optionResult.rows.length !== optionIds.length) {
          throw new Error('유효하지 않은 옵션이 포함되어 있습니다')
        }

        optionRows = optionResult.rows
        optionTotal = optionRows.reduce((sum, row) => sum + row.price, 0)
      }

      const lineUnitPrice = menu.price + optionTotal
      const lineTotal = lineUnitPrice * quantity
      totalAmount += lineTotal

      normalizedItems.push({
        menu,
        quantity,
        lineTotal,
        optionRows,
      })
    }

    const orderResult = await client.query(
      `
      INSERT INTO orders (status, total_amount)
      VALUES ('주문 접수', $1)
      RETURNING id, ordered_at, status, total_amount
      `,
      [totalAmount],
    )
    const order = orderResult.rows[0]

    for (const item of normalizedItems) {
      const itemResult = await client.query(
        `
        INSERT INTO order_items (
          order_id,
          menu_id,
          menu_name_snapshot,
          base_price_snapshot,
          quantity,
          line_total
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        `,
        [
          order.id,
          item.menu.id,
          item.menu.name,
          item.menu.price,
          item.quantity,
          item.lineTotal,
        ],
      )

      const orderItemId = itemResult.rows[0].id
      for (const option of item.optionRows) {
        await client.query(
          `
          INSERT INTO order_item_options (
            order_item_id,
            option_id,
            option_name_snapshot,
            option_price_snapshot
          )
          VALUES ($1, $2, $3, $4)
          `,
          [orderItemId, option.id, option.name, option.price],
        )
      }

      await client.query(
        `
        UPDATE menus
        SET stock_quantity = stock_quantity - $1,
            updated_at = NOW()
        WHERE id = $2
        `,
        [item.quantity, item.menu.id],
      )
    }

    await client.query('COMMIT')

    return res.status(201).json({
      order: {
        id: order.id,
        orderedAt: order.ordered_at,
        status: order.status,
        totalAmount: order.total_amount,
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')
    if (
      error.message.includes('Invalid') ||
      error.message.includes('유효하지') ||
      error.message.includes('재고가 부족')
    ) {
      return res.status(400).json({ message: error.message })
    }
    return next(error)
  } finally {
    client.release()
  }
})

module.exports = router
