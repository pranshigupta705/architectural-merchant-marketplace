import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../features/api/apiSlice';

import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/cart/cartSlice';
import orderReducer from '../features/orders/orderSlice';
import wishlistReducer from '../features/wishlist/wishlistSlice';
// 1. ADDED: Import the new product draft slice
import productDraftReducer from '../features/productDraft/productDraftSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    orders: orderReducer,
    wishlist: wishlistReducer,
    // 2. ADDED: Register the product draft state
    productDraft: productDraftReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});