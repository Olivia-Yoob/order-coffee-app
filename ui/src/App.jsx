import { useMemo, useState } from 'react'
import americanoHotImage from './assets/americano-hot.png'
import americanoIceImage from './assets/americano-ice.png'
import caffeLatteImage from './assets/caffe-latte.png'

const menuItems = [
  {
    id: 'americano-ice',
    name: '아메리카노(ICE)',
    price: 4000,
    image: americanoIceImage,
    description: '가볍고 산뜻한 아이스 아메리카노',
    options: [
      { id: 'shot', label: '샷 추가', price: 500 },
      { id: 'syrup', label: '시럽 추가', price: 0 },
    ],
  },
  {
    id: 'americano-hot',
    name: '아메리카노(HOT)',
    price: 4000,
    image: americanoHotImage,
    description: '진한 향을 담은 따뜻한 아메리카노',
    options: [
      { id: 'shot', label: '샷 추가', price: 500 },
      { id: 'syrup', label: '시럽 추가', price: 0 },
    ],
  },
  {
    id: 'cafe-latte',
    name: '카페라떼',
    price: 5000,
    image: caffeLatteImage,
    description: '주인장 Yoob의 원픽 라떼',
    options: [
      { id: 'shot', label: '샷 추가', price: 500 },
      { id: 'syrup', label: '시럽 추가', price: 0 },
    ],
  },
]

const moneyFormat = new Intl.NumberFormat('ko-KR')
const dateTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function getSelectedOptions(item, selectedOptionIds) {
  return item.options.filter((option) => selectedOptionIds.has(option.id))
}

function getLineUnitPrice(basePrice, selectedOptions) {
  return basePrice + selectedOptions.reduce((sum, option) => sum + option.price, 0)
}

function getInventoryStatusLabel(stock) {
  if (stock === 0) {
    return '품절'
  }
  if (stock < 5) {
    return '주의'
  }
  return '정상'
}

function getInventoryStatusClass(stock) {
  if (stock === 0) {
    return 'danger'
  }
  if (stock < 5) {
    return 'warning'
  }
  return 'normal'
}

function App() {
  const [activeTab, setActiveTab] = useState('order')
  const [selectedOptionsByMenu, setSelectedOptionsByMenu] = useState(() =>
    Object.fromEntries(menuItems.map((item) => [item.id, new Set()])),
  )
  const [cartItems, setCartItems] = useState([])
  const [inventoryByMenu, setInventoryByMenu] = useState({
    'americano-ice': 10,
    'americano-hot': 10,
    'cafe-latte': 10,
  })
  const [orders, setOrders] = useState([
    {
      id: 'order-1',
      createdAt: new Date('2026-07-31T13:00:00'),
      menuName: '아메리카노(ICE)',
      amount: 4000,
      status: '주문 접수',
    },
    {
      id: 'order-2',
      createdAt: new Date('2026-07-31T13:12:00'),
      menuName: '카페라떼',
      amount: 5000,
      status: '제조 중',
    },
  ])

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.linePrice * item.quantity, 0),
    [cartItems],
  )
  const groupedCartItems = useMemo(() => {
    const grouped = new Map()

    cartItems.forEach((item) => {
      const existing = grouped.get(item.menuId)

      if (existing) {
        existing.quantity += item.quantity
        existing.totalAmount += item.linePrice * item.quantity
        return
      }

      grouped.set(item.menuId, {
        menuId: item.menuId,
        name: item.name,
        quantity: item.quantity,
        totalAmount: item.linePrice * item.quantity,
      })
    })

    return Array.from(grouped.values())
  }, [cartItems])
  const dashboardCounts = useMemo(
    () => ({
      total: orders.length,
      received: orders.filter((order) => order.status === '주문 접수').length,
      making: orders.filter((order) => order.status === '제조 중').length,
      done: orders.filter((order) => order.status === '제조 완료').length,
    }),
    [orders],
  )

  const handleOptionToggle = (menuId, optionId) => {
    setSelectedOptionsByMenu((prev) => {
      const currentSet = prev[menuId] ?? new Set()
      const nextSet = new Set(currentSet)

      if (nextSet.has(optionId)) {
        nextSet.delete(optionId)
      } else {
        nextSet.add(optionId)
      }

      return { ...prev, [menuId]: nextSet }
    })
  }

  const handleAddToCart = (menuItem) => {
    const selectedIds = selectedOptionsByMenu[menuItem.id] ?? new Set()
    const selectedOptions = getSelectedOptions(menuItem, selectedIds)
    const linePrice = getLineUnitPrice(menuItem.price, selectedOptions)
    const optionKey = selectedOptions
      .map((option) => option.id)
      .sort()
      .join('|')
    const cartKey = `${menuItem.id}::${optionKey}`

    setCartItems((prev) => {
      const matched = prev.find((item) => item.cartKey === cartKey)

      if (matched) {
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [
        ...prev,
        {
          cartKey,
          menuId: menuItem.id,
          name: menuItem.name,
          quantity: 1,
          linePrice,
          selectedOptionLabels: selectedOptions.map((option) => option.label),
        },
      ]
    })
  }
  const handleStockChange = (menuId, diff) => {
    setInventoryByMenu((prev) => {
      const nextValue = Math.max(0, (prev[menuId] ?? 0) + diff)
      return { ...prev, [menuId]: nextValue }
    })
  }
  const handleStartMaking = (orderId) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId && order.status === '주문 접수'
          ? { ...order, status: '제조 중' }
          : order,
      ),
    )
  }

  return (
    <div className="page">
      <header className="top-nav">
        <h1 className="brand">COZY</h1>
        <nav className="nav-menu">
          <button
            type="button"
            className={`nav-button ${activeTab === 'order' ? 'active' : ''}`}
            onClick={() => setActiveTab('order')}
          >
            주문하기
          </button>
          <button
            type="button"
            className={`nav-button ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            관리자
          </button>
        </nav>
      </header>

      {activeTab === 'order' ? (
        <main className="content">
          <section className="menu-grid" aria-label="커피 메뉴">
            {menuItems.map((item) => {
              const selectedSet = selectedOptionsByMenu[item.id] ?? new Set()

              return (
                <article key={item.id} className="menu-card">
                  <img src={item.image} alt={item.name} className="menu-image" />
                  <p className="menu-name">{item.name}</p>
                  <p className="menu-price">{moneyFormat.format(item.price)}원</p>
                  <p className="menu-description">{item.description}</p>

                  <div className="menu-options">
                    {item.options.map((option) => (
                      <label key={option.id} className="option-label">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(option.id)}
                          onChange={() => handleOptionToggle(item.id, option.id)}
                        />
                        <span>
                          {option.label} (+{moneyFormat.format(option.price)}원)
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="primary-button add-button"
                    onClick={() => handleAddToCart(item)}
                  >
                    담기
                  </button>
                </article>
              )
            })}
          </section>

          <section className="cart-panel">
            <h2 className="cart-title">장바구니</h2>
            <div className="cart-layout">
              <div className="cart-order-list">
                {groupedCartItems.length === 0 ? (
                  <p className="cart-empty">장바구니가 비어 있습니다.</p>
                ) : (
                  <ul className="cart-list">
                    {groupedCartItems.map((item) => (
                      <li key={item.menuId} className="cart-line">
                        <p className="cart-line-name">{item.name}</p>
                        <p className="cart-quantity">X {item.quantity}</p>
                        <p className="cart-line-price">
                          {moneyFormat.format(item.totalAmount)}원
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="cart-summary">
                <p className="cart-total">
                  총 금액 <strong>{moneyFormat.format(totalPrice)}원</strong>
                </p>
                <button
                  type="button"
                  className="primary-button order-button"
                  disabled={cartItems.length === 0}
                >
                  주문하기
                </button>
              </div>
            </div>
          </section>
        </main>
      ) : (
        <main className="content admin-content">
          <section className="admin-section">
            <h2 className="admin-section-title">관리자 대시보드</h2>
            <div className="dashboard-grid">
              <article className="dashboard-card">
                <p className="dashboard-label">총 주문</p>
                <p className="dashboard-value">{dashboardCounts.total}</p>
              </article>
              <article className="dashboard-card">
                <p className="dashboard-label">주문 접수</p>
                <p className="dashboard-value">{dashboardCounts.received}</p>
              </article>
              <article className="dashboard-card">
                <p className="dashboard-label">제조 중</p>
                <p className="dashboard-value">{dashboardCounts.making}</p>
              </article>
              <article className="dashboard-card">
                <p className="dashboard-label">제조 완료</p>
                <p className="dashboard-value">{dashboardCounts.done}</p>
              </article>
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section-title">재고 현황</h2>
            <div className="inventory-grid">
              {menuItems.map((item) => {
                const stock = inventoryByMenu[item.id] ?? 0
                const statusLabel = getInventoryStatusLabel(stock)
                const statusClass = getInventoryStatusClass(stock)

                return (
                  <article key={item.id} className="inventory-card">
                    <p className="inventory-menu-name">{item.name}</p>
                    <div className="inventory-meta-row">
                      <p className="inventory-count">{stock}개</p>
                      <p className={`inventory-status status-${statusClass}`}>{statusLabel}</p>
                    </div>
                    <div className="inventory-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleStockChange(item.id, 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleStockChange(item.id, -1)}
                      >
                        -
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="admin-section">
            <h2 className="admin-section-title">주문 현황</h2>
            <ul className="admin-order-list">
              {orders.map((order) => (
                <li key={order.id} className="admin-order-row">
                  <p className="admin-order-time">{dateTimeFormat.format(order.createdAt)}</p>
                  <p className="admin-order-menu">{order.menuName}</p>
                  <p className="admin-order-amount">{moneyFormat.format(order.amount)}원</p>
                  <p className="admin-order-status">{order.status}</p>
                  {order.status === '주문 접수' ? (
                    <button
                      type="button"
                      className="primary-button admin-order-action"
                      onClick={() => handleStartMaking(order.id)}
                    >
                      제조 시작
                    </button>
                  ) : (
                    <span className="admin-order-action-placeholder">진행 중</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </main>
      )}
    </div>
  )
}

export default App
