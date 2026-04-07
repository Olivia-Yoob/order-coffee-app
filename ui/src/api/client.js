const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data.message || '요청 처리 중 오류가 발생했습니다.'
    throw new Error(message)
  }
  return data
}

export function fetchMenus() {
  return request('/menus')
}

export function createOrder(payload) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchAdminOrders() {
  return request('/admin/orders')
}

export function updateOrderStatus(orderId, status) {
  return request(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function updateMenuStock(menuId, diff) {
  return request(`/admin/menus/${menuId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ diff }),
  })
}
