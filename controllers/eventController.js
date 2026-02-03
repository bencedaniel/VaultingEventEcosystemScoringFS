import { logger, logOperation, logAuth, logError, logValidation, logWarn, logDebug } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteResponsiblePerson,
  addResponsiblePerson,
  selectEvent,
  getAllPermissions,
  getAllUsers
} from '../DataServices/eventData.js';

const renderNew = (req, res) => {
  res.render('event/newEvent', {
    formData: req.session.formData,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
};

const createNew = asyncHandler(async (req, res) => {
  const newEvent = await createEvent(req.body);
  logOperation('EVENT_CREATE', `Event created: ${newEvent.name}`, req.user.username, HTTP_STATUS.CREATED);
  req.session.successMessage = MESSAGES.SUCCESS.EVENT_CREATED;
  res.redirect('/admin/event/dashboard');
});

const dashboard = asyncHandler(async (req, res) => {
  const events = await getAllEvents();
  logDebug('Session', req.session.successMessage);
  res.render('event/eventdash', {
    events,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

const editGet = asyncHandler(async (req, res) => {
  const event = await getEventById(req.params.id);
  res.render('event/editEvent', {
    formData: event,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

const editPost = asyncHandler(async (req, res) => {
  const event = await updateEvent(req.params.id, req.body);
  logOperation('EVENT_UPDATE', `Event updated: ${event.name}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.EVENT_UPDATED;
  res.redirect('/admin/event/dashboard');
});

const details = asyncHandler(async (req, res) => {
  const event = await getEventById(req.params.id);
  const users = await getAllUsers();
  res.render('event/EventDetail', {
    users: users,
    formData: event,
    rolePermissons: req.user?.role?.permissions,
    failMessage: req.session.failMessage,
    successMessage: req.session.successMessage,
    user: req.user
  });
  req.session.failMessage = null;
  req.session.successMessage = null;
});

const deleteResponsiblePersonHandler = asyncHandler(async (req, res) => {
  const event = await deleteResponsiblePerson(req.params.id, req.body);
  logOperation('EVENT_UPDATE', `Event updated: ${event.EventName}`, req.user.username, HTTP_STATUS.OK);
  res.status(HTTP_STATUS.OK).json({ message: req.body.name + ' ' + MESSAGES.SUCCESS.RESPONSIBLE_PERSON_DELETED + req.user.username });
});

const addResponsiblePersonHandler = asyncHandler(async (req, res) => {
  const event = await addResponsiblePerson(req.params.id, req.body);
  logOperation('EVENT_UPDATE', `Event updated: ${event.EventName}`, req.user.username, HTTP_STATUS.OK);
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.RESPONSIBLE_PERSON_ADDED });
});

const selectEventHandler = asyncHandler(async (req, res) => {
  const event = await selectEvent(req.params.eventId);
  logOperation('EVENT_UPDATE', `Event updated: ${event.EventName}`, req.user.username, HTTP_STATUS.OK);
  req.session.selectedEvent = event._id;
  req.session.successMessage = MESSAGES.SUCCESS.EVENT_SELECTED + ' ' + event.EventName;
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.EVENT_SELECTED + ' ' + event.EventName });
});

export default {
  renderNew,
  createNew,
  dashboard,
  editGet,
  editPost,
  details,
  deleteResponsiblePersonHandler,
  addResponsiblePersonHandler,
  selectEventHandler
};
