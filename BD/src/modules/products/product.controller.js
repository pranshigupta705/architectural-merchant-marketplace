import Product from './product.model.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * @desc    Fetch all products (with Search, Pagination, and Filters)
 * @route   GET /api/v1/products
 * @access  Public
 */
export const getProducts = async (req, res, next) => {

  
  try {
    // 1. Safely parse pagination parameters
    console.log("🚦 TRACE 1: Entered createProduct controller!");
    console.log("🖼️ Files received:", req.files ? req.files.length : 0);
    console.log("📦 Body received:", req.body.title);
    const pageSize = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    
    // 2. Build Advanced Query Object safely
    const queryObj = {};

    if (req.query.keyword && req.query.keyword.trim() !== '') {
      queryObj.$or = [
        { title: { $regex: req.query.keyword.trim(), $options: 'i' } },
        { 'inventory.sku': { $regex: req.query.keyword.trim(), $options: 'i' } }
      ];
    }

    if (req.query.category && req.query.category.trim() !== '') {
      queryObj.category = { $regex: req.query.category.trim(), $options: 'i' };
    }

    if (req.query.status && req.query.status.trim() !== '') {
      queryObj.status = req.query.status.trim();
    }

    // 3. Robust Price Filtering (Prevents NaN database crashes)
    const minP = parseFloat(req.query.minPrice);
    const maxP = parseFloat(req.query.maxPrice);

    if (!isNaN(minP) || !isNaN(maxP)) {
      queryObj.price = {};
      if (!isNaN(minP)) queryObj.price.$gte = minP;
      if (!isNaN(maxP)) queryObj.price.$lte = maxP;
    }

    // 4. Execute Highly Optimized Queries Concurrently
    const [count, products] = await Promise.all([
      Product.countDocuments(queryObj),
      Product.find(queryObj)
        .populate('merchantId', 'name email')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 })
        .lean() // Strips Mongoose overhead for faster reads
    ]);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        pages: Math.ceil(count / pageSize),
        totalProducts: count,
      }
    });
  } catch (error) {
    next(new ApiError(500, 'Error fetching products', error.message));
  }
};

/**
 * @desc    Fetch single product
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('merchantId', 'name email')
      .lean();

    if (!product) {
      return next(new ApiError(404, 'Product not found'));
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(new ApiError(500, 'Error fetching product', error.message));
  }
};

/**
 * @desc    Create a product (With Image Uploads)
 * @route   POST /api/v1/products
 * @access  Private (Merchant/Admin only)
 */
export const createProduct = async (req, res, next) => {
  try {
    let productData = { ...req.body, merchantId: req.user._id };

    // Handle Image Uploads from Multer
    if (req.files?.length > 0) {
      productData.images = req.files.map((file, index) => ({
        url: file.path, 
        isMain: index === 0 
      }));
    }

    // Parse nested JSON strings safely
    const parseIfString = (val) => (typeof val === 'string' ? JSON.parse(val) : val);
    
    if (req.body.technicalSpecs) productData.technicalSpecs = parseIfString(req.body.technicalSpecs);
    if (req.body.inventory) productData.inventory = parseIfString(req.body.inventory);
    if (req.body.shipping) productData.shipping = parseIfString(req.body.shipping);

    productData.status = req.body.status || 'DRAFT';

    const product = await Product.create(productData);

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(400, 'A product with this SKU already exists.'));
    }
    next(new ApiError(500, 'Error creating product', error.message));
  }
};

/**
 * @desc    Update a product (With Image Uploads)
 * @route   PUT /api/v1/products/:id
 * @access  Private (Merchant/Admin only)
 */
export const updateProduct = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id } 
      : { _id: req.params.id, merchantId: req.user._id };

    let updateData = { ...req.body };

    if (req.files?.length > 0) {
      updateData.images = req.files.map((file, index) => ({
        url: file.path,
        isMain: index === 0 
      }));
    }

    const parseIfString = (val) => (typeof val === 'string' ? JSON.parse(val) : val);
    
    if (req.body.technicalSpecs) updateData.technicalSpecs = parseIfString(req.body.technicalSpecs);
    if (req.body.inventory) updateData.inventory = parseIfString(req.body.inventory);
    if (req.body.shipping) updateData.shipping = parseIfString(req.body.shipping);

    const updatedProduct = await Product.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return next(new ApiError(404, 'Product not found or unauthorized to update'));
    }

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(400, 'A product with this SKU already exists.'));
    }
    next(new ApiError(500, 'Error updating product', error.message));
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/v1/products/:id
 * @access  Private (Merchant/Admin only)
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id } 
      : { _id: req.params.id, merchantId: req.user._id };

    const deletedProduct = await Product.findOneAndDelete(query);

    if (!deletedProduct) {
      return next(new ApiError(404, 'Product not found or unauthorized to delete'));
    }

    res.status(200).json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    next(new ApiError(500, 'Error deleting product', error.message));
  }
};