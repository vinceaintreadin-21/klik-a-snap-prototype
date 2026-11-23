import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useOrders } from '../context/OrderContext'

// Store the ID so a selected order follows refreshed status and roster data.
export function useOrderSelection() {
  const location = useLocation()
  const { orders } = useOrders()
  const [selectedId, setSelectedId] = useState<number | null>(
    (location.state as { orderId?: number } | null)?.orderId ?? null,
  )
  const selectedOrder = orders.find(order => order.id === selectedId) ?? null
  const setSelectedOrder = (order: { id: number } | null) => {
    setSelectedId(order?.id ?? null)
  }
  return { selectedOrder, setSelectedOrder }
}
