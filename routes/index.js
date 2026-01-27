
import router from './routes.js';
import adminRouter from './adminRouter.js';
import horseRouter from './horseRouter.js';
import vaulterRouter from './vaulterRouter.js';
import lungerRouter from './lungerRouter.js';
import eventRouter from './eventRouter.js';
import categoryRouter from './categoryRouter.js';
import entryRouter from './entryRouter.js';
import JudgesRouter from './judgesRouter.js';
import dailytimetableRouter from './DtimetableRouter.js';
import alertRouter from './alertRouter.js';
import orderRouter from './orderRouter.js';
import SSTempRouter from './SSTempRouter.js';
import scoringRouter from './scoringRouter.js';
import mappingRouter from './mappingRouter.js';
import resultRouter from './resultRouter.js';


const setupRoutes = (app) => {
  // ============================================
  // MAIN ROUTES
  // ============================================
  app.use('/', router);

  // ============================================
  // ADMIN ROUTES
  // ============================================
  app.use('/admin', adminRouter);

  // ============================================
  // ENTITY ROUTES
  // ============================================
  app.use('/horse', horseRouter);
  app.use('/vaulter', vaulterRouter);
  app.use('/lunger', lungerRouter);
  app.use('/category', categoryRouter);
  app.use('/admin/event', eventRouter);
  app.use('/entry', entryRouter);

  // ============================================
  // OPERATIONAL ROUTES
  // ============================================
  app.use('/judges', JudgesRouter);
  app.use('/dailytimetable', dailytimetableRouter);
  app.use('/alerts', alertRouter);
  app.use('/order', orderRouter);

  // ============================================
  // SCORING & RESULTS ROUTES
  // ============================================
  app.use('/scoresheets', SSTempRouter);
  app.use('/scoring', scoringRouter);
  app.use('/mapping', mappingRouter);
  app.use('/result', resultRouter);
};

export default setupRoutes;
