import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// 1. Configure Cloudinary with your credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Set up the Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'architectural_merchant/products', // Creates a folder in your Cloudinary dashboard
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // Automatically limit the dimensions to keep load times fast
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], 
  },
});

// 3. Export the upload middleware
export const uploadProductImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per image
  },
});