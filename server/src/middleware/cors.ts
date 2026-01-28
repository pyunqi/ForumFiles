import cors from 'cors';

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

export const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // If ALLOWED_ORIGINS is set and contains specific origins, check them
    if (allowedOrigins.length > 0) {
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // If no ALLOWED_ORIGINS set, allow all origins (development mode)
      // Return the actual origin instead of '*' to work with credentials
      callback(null, origin);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'], // For file downloads
  preflightContinue: false,
  optionsSuccessStatus: 204
};

export const corsMiddleware = cors(corsOptions);
