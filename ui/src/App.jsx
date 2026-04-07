import { useMemo, useState } from 'react'
import AdminScreen from './components/AdminScreen'
import OrderScreen from './components/OrderScreen'
import { menuItems } from './data/menu'
import { initialInventoryByMenu, initialOrders } from './data/mockAdmin'

function getSelectedOptions(item, selectedOptionIds) {
  return item.options.filter((option) => selectedOptionIds.has(option.id))
}

function getLineUnitPrice(basePrice, selectedOptions) {
  return basePrice + selectedOptions.reduce((sum, option) => sum + option.price, 0)
}

function App() {
  const [activeTab, setActiveTab] = useState('order')
  const [selectedOptionsByMenu, setSelectedOptionsByMenu] = useState(() =>
    Object.fromEntries(menuItems.map((item) => [item.id, new Set()])),
  )
  const [cartItems, setCartItems] = useState([])
  const [inventoryByMenu, setInventoryByMenu] = useState(initialInventoryByMenu)
  const [orders, setOrders] = useState(() =>
    initialOrders.map((order) => ({ ...order, createdAt: new Date(order.createdAt) })),
  )

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.linePrice * item.quantity, 0),
    [cartItems],
  )
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
  const handleCompleteMaking = (orderId) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId && order.status === '제조 중'
          ? { ...order, status: '제조 완료' }
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
        <OrderScreen
          menuItems={menuItems}
          selectedOptionsByMenu={selectedOptionsByMenu}
          cartItems={cartItems}
          totalPrice={totalPrice}
          onToggleOption={handleOptionToggle}
          onAddToCart={handleAddToCart}
        />
      ) : (
        <AdminScreen
          menuItems={menuItems}
          inventoryByMenu={inventoryByMenu}
          orders={orders}
          dashboardCounts={dashboardCounts}
          onStockChange={handleStockChange}
          onStartMaking={handleStartMaking}
          onCompleteMaking={handleCompleteMaking}
        />
      )}
    </div>
  )
}

export default App
