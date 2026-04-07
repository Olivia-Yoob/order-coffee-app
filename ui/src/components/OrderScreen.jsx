const moneyFormat = new Intl.NumberFormat('ko-KR')

export default function OrderScreen({
  menuItems,
  selectedOptionsByMenu,
  cartItems,
  totalPrice,
  onToggleOption,
  onAddToCart,
}) {
  return (
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
                      onChange={() => onToggleOption(item.id, option.id)}
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
                onClick={() => onAddToCart(item)}
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
            {cartItems.length === 0 ? (
              <p className="cart-empty">장바구니가 비어 있습니다.</p>
            ) : (
              <ul className="cart-list">
                {cartItems.map((item) => (
                  <li key={item.cartKey} className="cart-line">
                    <p className="cart-line-name">
                      {item.name}
                      {item.selectedOptionLabels.length > 0
                        ? ` (${item.selectedOptionLabels.join(', ')})`
                        : ''}
                    </p>
                    <p className="cart-quantity">X {item.quantity}</p>
                    <p className="cart-line-price">
                      {moneyFormat.format(item.linePrice * item.quantity)}원
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
  )
}
