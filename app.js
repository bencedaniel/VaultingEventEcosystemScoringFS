import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/routes.js';
import adminRouter from './routes/adminRouter.js';
import connectDB from './database/db.js';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import {dblogger, logger} from './logger.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import horseRouter from './routes/horseRouter.js';
import vaulterRouter from './routes/vaulterRouter.js';
import lungerRouter from './routes/lungerRouter.js';
import { StoreUserWithoutValidation } from './middleware/Verify.js';
import morgan from 'morgan';

// Az aktuális fájl és könyvtár meghatározása
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables first!
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const { MONGODB_URI, PORT, SECRET_ACCESS_TOKEN, SECURE_MODE,SECRET_API_KEY,TESTDB } = process.env;
export { MONGODB_URI, PORT, SECRET_ACCESS_TOKEN, SECURE_MODE,SECRET_API_KEY,TESTDB };
if (!MONGODB_URI || !PORT || !SECRET_ACCESS_TOKEN || !SECRET_API_KEY) {
  logger.error('Missing required environment variables');
  process.exit(1);
}else{logger.info('All required environment variables are set');}

connectDB(); // Adatbázis-kapcsolódás

// Middleware-ek beállítása
app.set('views', path.join(__dirname, 'views')); // A 'views' könyvtár beállítása
app.set('view engine', 'ejs'); // EJS sablonmotor beállítása

app.use(expressLayouts); // Layout
if(TESTDB==='true'){ 
    app.set('layout', 'layouts/testlayout'); // Layout könyvtár beállítása
}else{
    app.set('layout', 'layouts/layout'); // Layout könyvtár beállítása
}
app.use(express.json()); // JSON formátumú adatok feldolgozása és elérhetősége a 'req.body' objektumon keresztül
app.use(express.urlencoded({ extended: true })); // URL-en keresztül érkező, formázott adatok feldolgozása és elérhetősége a 'req.body' objektumon keresztül
app.use(cors());
app.disable("x-powered-by"); //Reduce fingerprinting
app.use(cookieParser());
app.use('/static', express.static(path.join(__dirname, '/static'))); // static könyvtár elérése
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); // fejlesztéskor részletes log
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

app.use((req, res, next) => {
  res.on('finish', () => {
    const userInfo = req.user ? req.user.username || req.user._id : 'Anonymous';
    logger.info(
      `${req.method} ${req.originalUrl} - ${req.ip} - User-Agent: ${req.get('User-Agent')} - User: ${userInfo}`
    );
  });
  next();
});
const version = '0.0.10';
app.use((req, res, next) => {
  res.locals.version = version; // vagy amit szeretnél
  next();
});

app.use('/', router); // Útvonalak kezelése

app.use('/admin', adminRouter); // Admin útvonalak kezelése
app.use('/horse', horseRouter); // Horse útvonalak kezelése
app.use('/vaulter', vaulterRouter); // Vaulter útvonalak kezelése
app.use('/lunger', lungerRouter); // Lunger útvonalak kezelése



app.use(StoreUserWithoutValidation);
app.use((req, res, next) => {
    res.status(404).render("errorpage", {rolePermissons: req.user?.role?.permissions,errorCode: 404, failMessage: req.session.failMessage, user:req.user,
            successMessage: req.session.successMessage
    });
});
app.use((err, req, res, next) => {
  
    logger.error(err);
    res.status(500).render("errorpage", {rolePermissons: req.user?.role.permissions,errorCode: 500, failMessage: req.session.failMessage,user:req.user,
            successMessage: req.session.successMessage
    });
});

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev')); // fejlesztéskor részletes log
}

app.listen(process.env.PORT, () => {
    logger.info('---------------------------------------------');
    logger.info('VaultingEventEcosystemScoring server startup');
    logger.info(`Start time: ${new Date().toISOString()}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Version: ${version || 'unknown'}`);
    logger.info(`Port: ${process.env.PORT}`);
    logger.info(`MongoDB URI: ${process.env.MONGODB_URI ? 'set' : 'NOT SET'}`);
    logger.info(`Session secret: ${process.env.SECRET_API_KEY ? 'set' : 'NOT SET'}`);
    logger.info(`Secure mode: ${process.env.SECURE_MODE}`);
    logger.info(`Test DB: ${process.env.TESTDB === 'true' ? 'ACTIVE' : 'inactive'}`);
    logger.info(`Layout: ${process.env.TESTDB === 'true' ? 'testlayout' : 'layout'}`);
    logger.info(`Static dir: ${path.join(__dirname, '/static')}`);
    logger.info('---------------------------------------------');
    logger.info(`A szerver fut a ${process.env.NODE_ENV === 'development' 
  ? `http://localhost:${process.env.PORT}` 
  : `https://vaultx.bencedaniel.hu`} címen...`);
});
