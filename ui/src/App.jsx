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

function getSelectedOptions(item, selectedOptionIds) {
  return item.options.filter((option) => selectedOptionIds.has(option.id))
}

function getLineUnitPrice(basePrice, selectedOptions) {
  return basePrice + selectedOptions.reduce((sum, option) => sum + option.price, 0)
}

function App() {
  const [selectedOptionsByMenu, setSelectedOptionsByMenu] = useState(() =>
    Object.fromEntries(menuItems.map((item) => [item.id, new Set()])),
  )
  const [cartItems, setCartItems] = useState([])

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

  return (
    <div className="page">
      <header className="top-nav">
        <h1 className="brand">COZY</h1>
        <nav className="nav-menu">
          <button type="button" className="nav-button active">
            주문하기
          </button>
          <button type="button" className="nav-button">
            관리자
          </button>
        </nav>
      </header>

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
    </div>
  )
}

export default App
