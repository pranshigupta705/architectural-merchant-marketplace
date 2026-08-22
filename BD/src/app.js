import express from 'express';
import cors from 'cors';
import path from 'path'; 

// --- Security & Utility Middlewares ---
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

// --- Route Imports ---
import authRoutes from './modules/auth/auth.route.js'; 
import productRoutes from './modules/products/product.route.js';
import userRoutes from './modules/users/user.routes.js'; 
import orderRoutes from './modules/orders/order.route.js';
import analyticsRoutes from './modules/analytics/analytics.route.js';
import uploadRoutes from './modules/upload/upload.route.js';
import customerRoutes from './modules/customers/customer.route.js'; 

// --- Error Handling Imports ---
// FIXED PATH: Changed 'middlewares' to 'middleware' to match your actual folder structure
import { errorHandler } from './middleware/error.middleware.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

// ==========================================
// 1. GLOBAL MIDDLEWARES
// ==========================================

app.use((req, res, next) => {
  console.log("=== NEW REQUEST RECEIVED ===");
  console.log(`[${req.method}] ${req.url}`);
  console.log("1. Content-Type Header:", req.headers['content-type']);
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(helmet());

app.use(cors({
  origin: "https://architectural-merchant-marketplace.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true, 
}));

app.use(express.json({ limit: '10kb' })); 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

const __dirname = path.resolve(); 
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// ==========================================
// 2. API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/customers', customerRoutes);

// ==========================================
// 3. UNHANDLED ROUTE CATCHER (404)
// ==========================================
app.use((req, res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

// ==========================================
// 4. GLOBAL ERROR HANDLER
// ==========================================
app.use(errorHandler);

export default app;