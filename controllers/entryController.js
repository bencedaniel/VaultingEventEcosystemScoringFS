import { logger } from '../logger.js';
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
} from '../services/entryData.js';

class EntryController {
  renderNew = async (req, res) => {
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
  }

  createNew = async (req, res) => {
    try {
      const newEntry = await createEntry(req.body);
      logger.db(`Entry ${newEntry.name} created by user ${req.user.username}.`);
      req.session.successMessage = 'Entry created successfully!';
      res.redirect('/entry/dashboard');
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);

      const errorMessage = err.errors
        ? Object.values(err.errors).map(e => e.message).join(' ')
        : (err.message || 'Server error');
      const categorys = await getAllCategories();

      res.render('entry/newEntry', {
        vaulters: await getAllVaulters(),
        lungers: await getAllLungers(),
        horses: await getAllHorses(),
        categorys: categorys,
        events: await getAllEvents(),
        formData: req.session.formData,
        rolePermissons: req.user?.role?.permissions,
        failMessage: errorMessage,
        successMessage: req.session.successMessage,
        user: req.user
      });
      req.session.failMessage = null;
      req.session.successMessage = null;
    }
  }

  dashboard = async (req, res) => {
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
  }

  editGet = async (req, res) => {
    try {
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
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/entry/dashboard');
    }
  }

  editPost = async (req, res) => {
    try {
      logger.debug(req.body);
      const updateData = { ...req.body, _id: req.params.id };
      const { oldEntry, newEntry } = await updateEntry(req.params.id, updateData, res.locals.selectedEvent._id);

      logger.db(`Entry ${oldEntry.EntryDispName} updated by user ${req.user.username}.`);
      req.session.successMessage = 'Entry updated successfully!';
      res.redirect('/entry/dashboard');
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);

      const errorMessage = err.errors
        ? Object.values(err.errors).map(e => e.message).join(' ')
        : (err.message || 'Server error');
      const categorys = await getAllCategories();
      return res.render('entry/editEntry', {
        vaulters: await getAllVaulters(),
        lungers: await getAllLungers(),
        horses: await getAllHorses(),
        categorys: categorys,
        events: await getAllEvents(),
        formData: { ...req.body, _id: req.params.id },
        rolePermissons: req.user?.role?.permissions,
        failMessage: errorMessage,
        successMessage: req.session.successMessage,
        user: req.user
      });
    }
  }

  deleteIncident = async (req, res) => {
    try {
      const entry = await deleteEntryIncident(req.params.id, req.body);
      logger.db(`Entry ${entry.name} incident deleted by user ${req.user.username}.`);
      res.status(200).json({ message: 'Incident deleted successfully' });
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      res.status(500).json({ message: err.message || 'Server error' });
    }
  }

  newIncidentPost = async (req, res) => {
    try {
      const incidentData = {
        description: req.body.description,
        incidentType: req.body.incidentType,
        userId: req.user._id
      };
      const entry = await addEntryIncident(req.params.id, incidentData);
      logger.db(`Entry ${entry.Name} incident created by user ${req.user.username}.`);
      res.status(200).json({ message: 'Incident added successfully!' });
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      const errorMessage = err.errors
          ? Object.values(err.errors).map(e => e.message).join(' ')
          : (err.message || 'Server error');
      req.session.failMessage = errorMessage;
      res.status(500).json({ message: errorMessage });
    }
  }

  vetCheckGet = async (req, res) => {
    try {
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
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/entry/dashboard');
    }
  }

  updateVetStatus = async (req, res) => {
    try {
      const statusData = {
        status: req.body.status,
        userId: req.user._id,
        eventId: res.locals.selectedEvent._id
      };
      const horse = await updateHorseVetStatus(req.params.horseId, statusData);
      logger.db(`Horse ${horse.Horsename} vet status updated to ${req.body.status} by user ${req.user.username}.`);
      res.status(200).json({ message: 'Vet status updated successfully' });
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      const errorMessage = err.errors
          ? Object.values(err.errors).map(e => e.message).join(' ')
          : (err.message || 'Server error');
      req.session.failMessage = errorMessage;
      res.status(500).json({ message: errorMessage });
    }
  }
}

export default new EntryController();
