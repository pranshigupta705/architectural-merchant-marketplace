// SERVER/src/modules/products/product.route.js

import express from 'express';

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from './product.controller.js';

import {
  protect,
  authorizeRoles
} from '../auth/auth.middleware.js';

import {
  uploadProductImages
} from '../../middleware/upload.middleware.js';

import { validateRequest, createProductSchema } from '../../middleware/validation.middleware.js';

const router = express.Router();

// ==========================================
// /api/products
// ==========================================
router.route('/')
  .get(getProducts)

  .post(
    // 1. Authentication & Authorization
    protect,
    authorizeRoles('admin', 'merchant'),

    // 🚦 TRAP 1: Auth check
    (req, res, next) => {
      console.log('✅ AUTH PASSED');
      next();
    },

    // 2. File Upload
    uploadProductImages.array('images', 5),

    // 3. Validate product data from FormData
    validateRequest(createProductSchema),

    // 🚦 TRAP 2: Multer/Cloudinary check
    (req, res, next) => {
      console.log('✅ MULTER/CLOUDINARY PASSED');
      console.log('📸 FILES:', req.files ? req.files.length : 0);
      console.log('📦 BODY:', req.body);
      next();
    },

    // 3. Save product to MongoDB
    createProduct
  );

// ==========================================
// /api/products/:id
// ==========================================
router.route('/:id')
  .get(getProductById)

  .put(
    protect,
    authorizeRoles('admin', 'merchant'),
    uploadProductImages.array('images', 5),
    updateProduct
  )

  .delete(
    protect,
    authorizeRoles('admin', 'merchant'),
    deleteProduct
  );

export default router;