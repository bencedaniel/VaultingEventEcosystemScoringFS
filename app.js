import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './database/db.js';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import { logger } from './logger.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import Event from './models/Event.js';
import Alert from './models/Alert.js';
import { StoreUserWithoutValidation } from './middleware/Verify.js';
import setupRoutes from './routes/index.js';

// ============================================
// INITIALIZATION
// ============================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const version = '0.0.25';

// Load environment variables first!
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const { MONGODB_URI, PORT, SECRET_ACCESS_TOKEN, SECURE_MODE, SECRET_API_KEY, TESTDB } = process.env;
export { MONGODB_URI, PORT, SECRET_ACCESS_TOKEN, SECURE_MODE, SECRET_API_KEY, TESTDB };

// Validate environment variables
if (!MONGODB_URI || !PORT || !SECRET_ACCESS_TOKEN || !SECRET_API_KEY) {
  logger.error('Missing required environment variables');
  process.exit(1);
} else {
  logger.info('All required environment variables are set');
}

connectDB(); // Database connection

// ============================================
// VIEW ENGINE CONFIGURATION
// ============================================
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// ============================================
// GLOBAL MIDDLEWARE - ORDER MATTERS
// ============================================

// 1. Logging & Security
app.use(expressLayouts);
app.set('layout', 'layouts/layout');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.disable('x-powered-by');
app.use(cookieParser());

// 2. Static files
app.use('/static', express.static(path.join(__dirname, '/static')));

// 3. Development logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use(session({
  secret: SECRET_API_KEY,            // titkos kulcs a session-hoz
  resave: false,                // csak ha változott a session, mentsük
  saveUninitialized: false,     // üres session-t ne mentsünk
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // opcionális, pl. 1 nap
    httpOnly: true,
    secure: SECURE_MODE !== 'true',             // élesben: true
    sameSite: 'lax'
  }
}));

// 5. Request logging
app.use((req, res, next) => {
  res.on('finish', () => {
    const userInfo = req.user ? req.user.username || req.user._id : 'Anonymous';
    logger.info(
      `${req.method} ${req.originalUrl} - ${req.ip} - User-Agent: ${req.get('User-Agent')} - User: ${userInfo}`
    );
  });
  next();
});

// 6. Global context middleware
app.use(async (req, res, next) => {
  try {
    res.locals.test = TESTDB === 'true';
    res.locals.alerts = await Alert.find({ active: true }).populate('permission');
    res.locals.parent = '/dashboard';
    res.locals.selectedEvent = await Event.findOne({ selected: true });
    res.locals.version = version;
    next();
  } catch (err) {
    logger.error(`Error in global middleware: ${err}`);
    res.locals.alerts = [];
    res.locals.test = false;
    res.locals.parent = '/dashboard';
    res.locals.selectedEvent = null;
    res.locals.version = version;
    next();
  }
});

// ============================================
// ROUTES INITIALIZATION
// ============================================
setupRoutes(app);

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================







// 404 Not Found handler
app.use(StoreUserWithoutValidation);
app.use((req, res, next) => {
  res.status(404).render('errorpage', {
    rolePermissons: req.user?.role?.permissions,
    errorCode: 404,
    failMessage: req.session?.failMessage || 'Page not found',
    user: req.user,
    successMessage: req.session?.successMessage
  });
});

// Global error handler (must be last)
app.use((err, req, res, next) => {
  console.error(err);
  logger.error(`Error: ${err.message} | User: ${req.user?.username || 'Unknown'}`);
  
  req.session.failMessage = 'Internal server error. Please try again later.';
  
  res.status(500).render('errorpage', {
    rolePermissons: req.user?.role?.permissions,
    errorCode: 500,
    failMessage: req.session.failMessage,
    user: req.user,
    successMessage: null
  });
});

// ============================================
// SERVER START
// ============================================

app.listen(PORT, () => {
  logger.info('---------------------------------------------');
  logger.info('VaultingEventEcosystemScoring server startup');
  logger.info(`Start time: ${new Date().toISOString()}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.warn(`Version: ${version}`);
  logger.info(`Port: ${PORT}`);
  logger.info(`Node.js version: ${process.version}`);
  logger.info(`MongoDB: ${MONGODB_URI ? 'connected' : 'NOT SET'}`);
  logger.warn(`Secure mode: ${SECURE_MODE}`);
  logger.warn(`Test DB: ${TESTDB === 'true' ? 'ACTIVE' : 'inactive'}`);
  logger.info('---------------------------------------------');
  logger.info(
    `Server running at ${process.env.NODE_ENV === 'development'
      ? `http://localhost:${PORT}`
      : 'https://vaultx.bencedaniel.hu'}`
  );
});
