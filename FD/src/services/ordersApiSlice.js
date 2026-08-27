import { apiSlice } from '../features/api/apiSlice';

export const ordersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: () => '/orders',
      providesTags: ['Order'], 
    }),
  }),
});


export const { useGetOrdersQuery } = ordersApiSlice;