import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order, OrderStatus } from '../../types';

interface OrderState {
  /** The signed-in customer's own orders (`GET /orders`). */
  orders: Order[];
  /** The staff order book (`GET /admin/orders`). Kept separate - see below. */
  adminOrders: Order[];
  currentOrder: Order | null;
  /** True once an order list has been fetched, so UIs can tell "empty" from "not loaded yet". */
  ordersLoaded: boolean;
  /** Same flag for the staff order book. */
  adminOrdersLoaded: boolean;
}

/**
 * Orders are never seeded client-side. They are loaded per audience:
 * `GET /admin/orders` for staff and `GET /orders` for the signed-in customer,
 * so an anonymous visitor can never see an order book.
 *
 * The two audiences are held in separate fields on purpose. They used to share a
 * single `orders` array, which meant a customer opening the account page ran
 * `hydrateOrders` with their own (possibly zero) orders and silently destroyed
 * the full order book the admin console had just loaded - the admin order list
 * then rendered empty until a hard refresh.
 */
const initialState: OrderState = {
  orders: [],
  adminOrders: [],
  currentOrder: null,
  ordersLoaded: false,
  adminOrdersLoaded: false,
};

/** Applies a lifecycle transition to one order inside a list. */
const applyStatusChange = (
  list: Order[],
  payload: { orderId: string; status: OrderStatus; note?: string }
): void => {
  const order = list.find((o) => o.id === payload.orderId);
  if (!order) return;
  order.orderStatus = payload.status;
  order.statusHistory.push({
    status: payload.status,
    timestamp: new Date().toISOString(),
    note: payload.note,
  });
  if (payload.status === 'Delivered') {
    order.paymentStatus = 'Paid';
  }
};

export const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    /** Replaces the customer's locally held order list with what the API returned. */
    hydrateOrders: (state, action: PayloadAction<Order[]>) => {
      state.orders = action.payload;
      state.ordersLoaded = true;
      if (state.currentOrder && !action.payload.some((o) => o.id === state.currentOrder?.id)) {
        state.currentOrder = null;
      }
    },
    /** Replaces the staff order book. */
    hydrateAdminOrders: (state, action: PayloadAction<Order[]>) => {
      state.adminOrders = action.payload;
      state.adminOrdersLoaded = true;
    },
    createOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (
      state,
      action: PayloadAction<{ orderId: string; status: OrderStatus; note?: string }>
    ) => {
      applyStatusChange(state.orders, action.payload);
    },
    updateAdminOrderStatus: (
      state,
      action: PayloadAction<{ orderId: string; status: OrderStatus; note?: string }>
    ) => {
      applyStatusChange(state.adminOrders, action.payload);
    },
    /** Stores a single order fetched directly, e.g. an admin deep link. */
    upsertAdminOrder: (state, action: PayloadAction<Order>) => {
      const index = state.adminOrders.findIndex((o) => o.id === action.payload.id);
      if (index === -1) {
        state.adminOrders.unshift(action.payload);
      } else {
        state.adminOrders[index] = action.payload;
      }
      state.adminOrdersLoaded = true;
    },
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
  },
});

export const {
  hydrateOrders,
  hydrateAdminOrders,
  createOrder,
  updateOrderStatus,
  updateAdminOrderStatus,
  upsertAdminOrder,
  setCurrentOrder,
} = orderSlice.actions;

export const selectAllOrders = (state: { orders: OrderState }) => state.orders.orders;
export const selectOrdersLoaded = (state: { orders: OrderState }) => state.orders.ordersLoaded;
export const selectCurrentOrder = (state: { orders: OrderState }) => state.orders.currentOrder;
export const selectOrderByNumber = (orderNumber: string) => (state: { orders: OrderState }) =>
  state.orders.orders.find(
    (o) =>
      o.orderNumber.toLowerCase() === orderNumber.trim().toLowerCase() ||
      o.id.toLowerCase() === orderNumber.trim().toLowerCase()
  );

/* ---- Staff selectors ---------------------------------------------------- */

export const selectAllAdminOrders = (state: { orders: OrderState }) => state.orders.adminOrders;
export const selectAdminOrdersLoaded = (state: { orders: OrderState }) =>
  state.orders.adminOrdersLoaded;
export const selectAdminOrderById = (id: string) => (state: { orders: OrderState }) =>
  state.orders.adminOrders.find((o) => o.id === id || o.orderNumber === id);

export default orderSlice.reducer;