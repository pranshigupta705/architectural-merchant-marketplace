import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  prepareHeaders: (headers, { getState }) => {
    let token = getState().auth?.token;
    
    if (!token) {
      token = localStorage.getItem("accessToken");
      
    }
    
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// THIS EXPORT IS WHAT VITE WAS MISSING!
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Product",
    "Order",
    "Analytics",
    "User",
    "Cart",
    "Wishlist",
    "Customer"
  ],
  endpoints: () => ({}), 
});