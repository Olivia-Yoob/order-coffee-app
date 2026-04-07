import { useEffect, useMemo, useState } from 'react'
import AdminScreen from './components/AdminScreen'
import OrderScreen from './components/OrderScreen'
import {
  createOrder,
  fetchAdminOrders,
  fetchMenus,
  updateMenuStock,
  updateOrderStatus,
} from './api/client'
import { menuImageMap } from './data/imageMap'

function getSelectedOptions(item, selectedOptionIds) {
  return item.options.filter((option) => selectedOptionIds.has(option.id))
}

function getLineUnitPrice(basePrice, selectedOptions) {
  return basePrice + selectedOptions.reduce((sum, option) => sum + option.price, 0)
}

function App() {
  const [activeTab, setActiveTab] = useState('order')
  const [menuItems, setMenuItems] = useState([])
  const [selectedOptionsByMenu, setSelectedOptionsByMenu] = useState(() =>
    ({}),
  )
  const [cartItems, setCartItems] = useState([])
  const [orders, setOrders] = useState([])
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.linePrice * item.quantity, 0),
    [cartItems],
  )
  const inventoryByMenu = useMemo(
    () =>
      Object.fromEntries(
        menuItems.map((item) => [item.id, item.stockQuantity ?? 0]),
      ),
    [menuItems],
  )
  const dashboardCounts = useMemo(
    () => ({
      total: orders.length,
      received: orders.filter((order) => order.status === '주문 접수').length,
      making: orders.filter((order) => order.status === '제조 중').length,
      done: orders.filter((order) => order.status === '완료').length,
    }),
    [orders],
  )

  const loadMenus = async () => {
    try {
      const data = await fetchMenus()
      const normalizedMenus = data.menus.map((menu) => ({
        id: menu.id,
        name: menu.name,
        description: menu.description,
        price: menu.price,
        image: menuImageMap[menu.imageKey] || menuImageMap['caffe-latte'],
        stockQuantity: menu.stockQuantity,
        options: menu.options.map((option) => ({
          id: option.id,
          label: option.name,
          price: option.price,
        })),
      }))
      setMenuItems(normalizedMenus)
      setSelectedOptionsByMenu((prev) => {
        const next = { ...prev }
        for (const menu of normalizedMenus) {
          if (!(menu.id in next)) {
            next[menu.id] = new Set()
          }
        }
        return next
      })
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const loadOrders = async () => {
    try {
      const data = await fetchAdminOrders()
      setOrders(
        data.orders.map((order) => ({
          id: order.id,
          createdAt: new Date(order.orderedAt),
          menuName:
            order.items.length > 0
              ? `${order.items[0].menuName} x ${order.items[0].quantity}`
              : '-',
          amount: order.totalAmount,
          status: order.status,
        })),
      )
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  useEffect(() => {
    loadMenus()
    loadOrders()
  }, [])

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
          selectedOptionIds: selectedOptions.map((option) => option.id),
          selectedOptionLabels: selectedOptions.map((option) => option.label),
        },
      ]
    })
  }
  const handleStockChange = async (menuId, diff) => {
    try {
      await updateMenuStock(menuId, diff)
      await loadMenus()
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  const handlePlaceOrder = async () => {
    try {
      setIsSubmittingOrder(true)
      const payload = {
        items: cartItems.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
          optionIds: item.selectedOptionIds || [],
        })),
      }
      await createOrder(payload)
      setCartItems([])
      await Promise.all([loadMenus(), loadOrders()])
      setErrorMessage('')
      window.alert('주문이 완료되었습니다.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  const handleStartMaking = async (orderId) => {
    try {
      await updateOrderStatus(orderId, '제조 중')
      await loadOrders()
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }
  const handleCompleteMaking = async (orderId) => {
    try {
      await updateOrderStatus(orderId, '완료')
      await loadOrders()
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.message)
    }
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
          isSubmittingOrder={isSubmittingOrder}
          onToggleOption={handleOptionToggle}
          onAddToCart={handleAddToCart}
          onPlaceOrder={handlePlaceOrder}
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
      {errorMessage ? <p className="app-error">{errorMessage}</p> : null}
    </div>
  )
}

export default App
