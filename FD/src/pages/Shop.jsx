import { useState } from 'react';
import { Search, SlidersHorizontal, Loader2, AlertCircle } from 'lucide-react';
import { useGetProductsQuery } from '../services/productsApiSlice';

export default function Shop() {
  // Local state for basic search filtering
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch real products from your MongoDB database!
  const { data: response, isLoading, isError } = useGetProductsQuery();
  
  // Extract the data array
  const products = response?.data || [];

  // Frontend search filter
  const filteredProducts = products.filter(product => 
    product.status === 'ACTIVE' && // Only show active products to customers!
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      {/* Storefront Header */}
      <div className="bg-white border-b border-gray-200 pt-16 pb-12 px-6 sm:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-serif font-bold text-[#111827] mb-4">The Collection</h1>
            <p className="text-gray-500 text-[14px] leading-relaxed">
              Discover our meticulously curated selection of architectural hardware and bespoke furniture pieces, designed to elevate your space.
            </p>
          </div>
          
          {/* Search & Filter Toolbar */}
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search pieces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#F3F4F6] border-transparent rounded-md text-[13px] focus:bg-white focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all outline-none"
              />
            </div>
            <button className="flex items-center px-4 py-2.5 bg-white border border-gray-200 text-[#111827] text-[13px] font-bold rounded-md hover:bg-gray-50 transition-colors">
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-24 pt-12">
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-[#111827] mb-4" />
            <p className="text-gray-500 text-[13px] font-medium tracking-wider uppercase">Loading Collection...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-red-600">
            <AlertCircle className="w-10 h-10 mb-4 opacity-50" />
            <h3 className="font-bold text-lg mb-2">Unable to load collection</h3>
            <p className="text-sm">Please refresh the page or try again later.</p>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && !isError && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 text-gray-500">
                <p className="text-lg font-serif">No pieces found.</p>
                <p className="text-[13px]">Try adjusting your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="group cursor-pointer">
                    {/* Image Container */}
                    <div className="relative aspect-[4/5] mb-4 overflow-hidden rounded-sm bg-gray-200">
                      <img 
                        src={product.images?.[0]?.url || ''} 
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/600x800/eeeeee/999999?text=Image+Unavailable';
                        }}
                      />
                      {/* Optional: Low Stock Badge */}
                      {product.inventory?.stockQuantity > 0 && product.inventory?.stockQuantity <= 5 && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#111827] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                          Only {product.inventory.stockQuantity} Left
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-[#111827] text-[15px] mb-1">{product.title}</h3>
                        <p className="text-gray-500 text-[12px] uppercase tracking-wider">{product.category}</p>
                      </div>
                      <div className="font-sans font-bold text-[#111827] text-[15px]">
                        ${(product.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}