import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

console.log(
  '☁️ CLOUDINARY KEY CHECK:',
  process.env.CLOUDINARY_CLOUD_NAME ? '✅ FOUND' : '❌ MISSING'
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'architectural_merchant/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: 'limit',
      },
    ],
  },
});

export const uploadProductImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});