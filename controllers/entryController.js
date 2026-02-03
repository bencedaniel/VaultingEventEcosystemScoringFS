import { logger, logOperation, logAuth, logError, logValidation, logWarn, logDebug } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
    getAllVaulters,
    getAllLungers,
    getAllHorses,
    getAllCategories,
    getAllEvents,
    createEntry,
    getEntriesByEvent,
    getEntryByIdWithPopulation,
    updateEntry,
    deleteEntryIncident,
    addEntryIncident,
    getHorsesForEvent,
    updateHorseVetStatus,
    getSelectedEvent
} from '../DataServices/entryData.js';

class EntryController {
  renderNew = asyncHandler(async (req, res) => {
    const categorys = await getAllCategories();

    res.render('entry/newEntry', {
      vaulters: await getAllVaulters(),
      lungers: await getAllLungers(),
      horses: await getAllHorses(),
      categorys: categorys,
      events: await getAllEvents(),
      formData: req.session.formData,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  createNew = asyncHandler(async (req, res) => {
    const newEntry = await createEntry(req.body);
    logOperation('ENTRY_CREATE', `Entry created: ${newEntry.name}`, req.user.username, HTTP_STATUS.CREATED);
    req.session.successMessage = MESSAGES.SUCCESS.ENTRY_CREATED;
    res.redirect('/entry/dashboard');
  })

  dashboard = asyncHandler(async (req, res) => {
    const selectedEvent = await getSelectedEvent();
    const entrys = await getEntriesByEvent(selectedEvent._id);

    res.render('entry/entrydash', {
      entrys,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  editGet = asyncHandler(async (req, res) => {
    const entry = await getEntryByIdWithPopulation(req.params.id);
    const categorys = await getAllCategories();
    res.render('entry/editEntry', {
      vaulters: await getAllVaulters(),
      lungers: await getAllLungers(),
      horses: await getAllHorses(),
      categorys: categorys,
      events: await getAllEvents(),
      formData: entry,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  editPost = asyncHandler(async (req, res) => {
    logDebug('Entry request body', req.body);
    const updateData = { ...req.body, _id: req.params.id };
    const { oldEntry, newEntry } = await updateEntry(req.params.id, updateData, res.locals.selectedEvent._id);

    logOperation('ENTRY_UPDATE', `Entry updated: ${oldEntry.EntryDispName}`, req.user.username, HTTP_STATUS.OK);
    req.session.successMessage = MESSAGES.SUCCESS.ENTRY_UPDATED;
    res.redirect('/entry/dashboard');
  })

  deleteIncident = asyncHandler(async (req, res) => {
    const entry = await deleteEntryIncident(req.params.id, req.body);
    logOperation('ENTRY_UPDATE', `Entry updated: ${entry.name}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: 'Incident deleted successfully' });
  })

  newIncidentPost = asyncHandler(async (req, res) => {
    const incidentData = {
      description: req.body.description,
      incidentType: req.body.incidentType,
      userId: req.user._id
    };
    const entry = await addEntryIncident(req.params.id, incidentData);
    logOperation('ENTRY_UPDATE', `Entry incident created: ${entry.Name}`, req.user.username, HTTP_STATUS.CREATED);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.INCIDENT_ADDED });
  })

  vetCheckGet = asyncHandler(async (req, res) => {
    const horses = await getHorsesForEvent(res.locals.selectedEvent._id);
    horses.forEach(horse => {
      horse.HeadNr = horse.HeadNr.filter(h => String(h.eventID) === String(res.locals.selectedEvent._id));
      horse.BoxNr = horse.BoxNr.filter(b => String(b.eventID) === String(res.locals.selectedEvent._id));
    });
    res.render('entry/vetcheckdash', {
      horses,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  })

  updateVetStatus = asyncHandler(async (req, res) => {
    const statusData = {
      status: req.body.status,
      userId: req.user._id,
      eventId: res.locals.selectedEvent._id
    };
    const horse = await updateHorseVetStatus(req.params.horseId, statusData);
    logOperation('HORSE_UPDATE', `Horse updated: ${horse.Horsename}`, req.user.username, HTTP_STATUS.OK);
    res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.VET_STATUS_UPDATED });
  })
}

export default new EntryController();
