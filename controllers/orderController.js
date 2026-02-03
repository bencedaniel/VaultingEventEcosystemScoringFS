import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getTimetablePartById,
    getEntriesForCategories,
    validateAndFilterStartingOrder,
    updateStartingOrder,
    generateNewOrderNumber,
    updateEntryOrderNumber,
    checkAndGenerateConflictingOrders,
    generateCompleteStartingOrder,
    updateTimetablePartStatus,
    parseCategoriesArray
} from '../DataServices/orderData.js';


const editGet = asyncHandler(async (req, res) => {
  const timetablePart = await getTimetablePartById(req.params.id);
  const eventID = res.locals.selectedEvent?._id;

  if (!timetablePart.StartingOrder.length === 0 || timetablePart.drawingDone === false) {
    req.session.failMessage = MESSAGES.ERROR.NO_STARTING_ORDER;
    return res.redirect('/order/createSelect/' + req.params.id);
  }

  const categories = parseCategoriesArray(timetablePart.Category);
  const entries = await getEntriesForCategories(eventID, categories);

  const validEntryIds = entries.map(e => e._id);
  await validateAndFilterStartingOrder(timetablePart, validEntryIds);

  res.render('order/editorder', {
    entries: entries,
    formData: timetablePart,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

const overwrite = asyncHandler(async (req, res) => {
  const timetablePart = await updateStartingOrder(req.params.id, {
    entryId: req.body.id,
    newOrder: req.body.newOrder
  });

  logOperation('ORDER_UPDATE', `Order updated: TimetablePart ${timetablePart._id}, Entry ${req.body.id}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.STARTING_ORDER_UPDATED;
  return res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.STARTING_ORDER_UPDATED });
});

const createOrder = asyncHandler(async (req, res) => {
  const timetablePart = await getTimetablePartById(req.params.id);
  const eventID = res.locals.selectedEvent?._id;

  const categories = parseCategoriesArray(timetablePart.Category);
  const entries = await getEntriesForCategories(eventID, categories);

  if (!timetablePart.conflictsChecked) {
    const { timetablePart: updatedPart, conflictedEntries } = await checkAndGenerateConflictingOrders(timetablePart, entries);

    res.render('order/checkconflicts', {
      PreGeneratedOrder: updatedPart.StartingOrder,
      entries: conflictedEntries,
      formData: updatedPart,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;

  } else {
    const updatedPart = await generateCompleteStartingOrder(timetablePart, entries);

    res.render('order/vieworder', {
      entries: entries,
      formData: updatedPart,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  }
});

const confirmConflicts = asyncHandler(async (req, res) => {
  await updateTimetablePartStatus(req.params.id, { conflictsChecked: true });

  req.session.successMessage = MESSAGES.SUCCESS.CONFLICTS_CONFIRMED;
  return res.redirect('/order/createOrder/' + req.params.id);
});

const getNewOrder = asyncHandler(async (req, res) => {
  const timetablePart = await getTimetablePartById(req.params.id);
  const eventID = res.locals.selectedEvent?._id;

  const categories = parseCategoriesArray(timetablePart.Category);
  const entries = await getEntriesForCategories(eventID, categories);

  const randomnumber = await generateNewOrderNumber(timetablePart, entries.length, req.body.oldNumber);

  await updateEntryOrderNumber(req.params.id, req.body.id, randomnumber);

  logOperation('ORDER_UPDATE', `Order updated: TimetablePart ${req.params.id}, Entry ${req.body.id}`, req.user.username, HTTP_STATUS.OK);
  return res.status(HTTP_STATUS.OK).json({ newOrder: randomnumber });
});

const createSelectGet = asyncHandler(async (req, res) => {
  const timetablePart = await getTimetablePartById(req.params.id);

  res.render('order/createselect', {
    formData: timetablePart,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

const createSelectPost = asyncHandler(async (req, res) => {
  if (!req.body.creationMethod || (req.body.creationMethod !== 'Drawing' && req.body.creationMethod !== 'Copy')) {
    req.session.failMessage = MESSAGES.ERROR.INVALID_CREATION_METHOD;
    return res.redirect('/order/createSelect/' + req.params.id);
  }

  if (req.body.creationMethod === 'Drawing') {
    await updateTimetablePartStatus(req.params.id, { StartingOrder: [] });
    return res.redirect('/order/createOrder/' + req.params.id);

  } else if (req.body.creationMethod === 'Copy') {
    req.session.failMessage = MESSAGES.ERROR.COPY_METHOD_NOT_IMPLEMENTED;
    return res.redirect('/order/createSelect/' + req.params.id);
  }
});

export default {
  editGet,
  overwrite,
  createOrder,
  confirmConflicts,
  getNewOrder,
  createSelectGet,
  createSelectPost
};
