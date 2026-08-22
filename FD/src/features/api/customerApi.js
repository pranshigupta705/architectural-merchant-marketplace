import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const customerApi = createApi({
  reducerPath: 'customerApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api', 
    prepareHeaders: (headers, { getState }) => {
      const token = getState().customerAuth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },sss
  }),
  tagTypes: ['Product', 'Profile', 'Order'],
  
  endpoints: (builder) => ({
    
    // 1. PUBLIC CATALOG ENDPOINT (FIXED)
    getStorefrontProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params, 
      }),
      providesTags: (result) => {
        
        const productsArray = Array.isArray(result) ? result : result?.products || result?.data || [];
        
        return [
          ...productsArray.map(({ _id }) => ({ type: 'Product', id: _id })),
          { type: 'Product', id: 'LIST' },
        ];
      },
    }),

    // 2. FETCH SINGLE PRODUCT
    getStorefrontProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    // 3. PRIVATE CUSTOMER ENDPOINTS
    getCustomerProfile: builder.query({
      query: () => '/customers/profile',
      providesTags: ['Profile'],
    }),

    updateCustomerProfile: builder.mutation({
      query: (profileData) => ({
        url: '/customers/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['Profile'], 
    }),

    getCustomerOrders: builder.query({
      query: () => '/orders/my-orders',
      providesTags: (result) => {
        const ordersArray = Array.isArray(result) ? result : result?.orders || result?.data || [];
        return [
          ...ordersArray.map(({ _id }) => ({ type: 'Order', id: _id })),
          { type: 'Order', id: 'LIST' },
        ];
      },
    }),

    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),
    
  }),
});

export const {
  useGetStorefrontProductsQuery,
  useGetStorefrontProductByIdQuery,
  useGetCustomerProfileQuery,
  useUpdateCustomerProfileMutation,
  useGetCustomerOrdersQuery,
  useCreateOrderMutation,
} = customerApi;