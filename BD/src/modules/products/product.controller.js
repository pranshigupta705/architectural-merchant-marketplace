import Product from './product.model.js';
import { ApiError } from '../../utils/ApiError.js';

/**
 * @desc    Fetch all products (with Search, Pagination, and Filters)
 * @route   GET /api/v1/products
 * @access  Public
 */
export const getProducts = async (req, res, next) => {
  try {
    const pageSize = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;

    // 1. Build Advanced Query Object
    const queryObj = {};

    // Search Keyword setup
    if (req.query.keyword) {
      queryObj.$or = [
        { title: { $regex: req.query.keyword, $options: 'i' } },
        { 'inventory.sku': { $regex: req.query.keyword, $options: 'i' } }
      ];
    }

    // Filter by Status (e.g., ?status=ACTIVE)
    if (req.query.status) {
      queryObj.status = req.query.status;
    }

    // Filter by Price Range (e.g., ?minPrice=100&maxPrice=500)
    if (req.query.minPrice || req.query.maxPrice) {
      queryObj.price = {};
      if (req.query.minPrice) queryObj.price.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) queryObj.price.$lte = Number(req.query.maxPrice);
    }

    // Execute Query in parallel for maximum performance
    const [count, products] = await Promise.all([
      Product.countDocuments(queryObj),
      Product.find(queryObj)
        .populate('merchantId', 'name email')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 })
        .lean() // Highly optimized read-only query
    ]);

    res.status(200).json({
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
      .lean(); // Optimized read

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

    // 1. Handle Image Uploads from Multer
    if (req.files && req.files.length > 0) {
      const imagesArray = req.files.map((file, index) => ({
        url: file.path, // This is the Cloudinary URL returned by multer-storage-cloudinary
        isMain: index === 0 // Make the first uploaded image the main one
      }));
      productData.images = imagesArray;
    }

    // 2. Parse nested JSON fields
    // When using multipart/form-data for file uploads, nested objects arrive as stringified JSON.
    if (typeof req.body.technicalSpecs === 'string') productData.technicalSpecs = JSON.parse(req.body.technicalSpecs);
    if (typeof req.body.inventory === 'string') productData.inventory = JSON.parse(req.body.inventory);
    if (typeof req.body.shipping === 'string') productData.shipping = JSON.parse(req.body.shipping);

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
    // Admins can update any product, merchants only their own.
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id } 
      : { _id: req.params.id, merchantId: req.user._id };

    let updateData = { ...req.body };

    // Handle new Image Uploads if files are attached
    if (req.files && req.files.length > 0) {
      const imagesArray = req.files.map((file, index) => ({
        url: file.path,
        isMain: index === 0 
      }));
      updateData.images = imagesArray; 
    }

    // Parse nested JSON fields if they are sent as strings
    if (typeof req.body.technicalSpecs === 'string') updateData.technicalSpecs = JSON.parse(req.body.technicalSpecs);
    if (typeof req.body.inventory === 'string') updateData.inventory = JSON.parse(req.body.inventory);
    if (typeof req.body.shipping === 'string') updateData.shipping = JSON.parse(req.body.shipping);

    // Find and update in a single atomic database call
    const updatedProduct = await Product.findOneAndUpdate(
      query,
      { $set: updateData }, // $set updates only the provided fields, leaving others intact
      { new: true, runValidators: true } // Returns updated doc, enforces schema rules
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