const moneyFormat = new Intl.NumberFormat('ko-KR')
const dateTimeFormat = new Intl.DateTimeFormat('ko-KR', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function getInventoryStatusLabel(stock) {
  if (stock === 0) return '품절'
  if (stock < 5) return '주의'
  return '정상'
}

function getInventoryStatusClass(stock) {
  if (stock === 0) return 'danger'
  if (stock < 5) return 'warning'
  return 'normal'
}

function getDisplayStatus(status) {
  if (status === '완료') return '제조 완료'
  return status
}

export default function AdminScreen({
  menuItems,
  inventoryByMenu,
  orders,
  dashboardCounts,
  onStockChange,
  onStartMaking,
  onCompleteMaking,
}) {
  return (
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
                    onClick={() => onStockChange(item.id, 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onStockChange(item.id, -1)}
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
              <p className="admin-order-status">{getDisplayStatus(order.status)}</p>
              {order.status === '주문 접수' ? (
                <button
                  type="button"
                  className="primary-button admin-order-action"
                  onClick={() => onStartMaking(order.id)}
                >
                  제조 시작
                </button>
              ) : null}
              {order.status === '제조 중' ? (
                <button
                  type="button"
                  className="primary-button admin-order-action"
                  onClick={() => onCompleteMaking(order.id)}
                >
                  제조 완료
                </button>
              ) : null}
              {order.status === '완료' ? (
                <span className="admin-order-action-placeholder done">완료</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
