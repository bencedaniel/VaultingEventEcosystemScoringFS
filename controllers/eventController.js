import { logger } from '../logger.js';
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
} from '../services/eventData.js';

class EventController {
  renderNew = (req, res) => {
    res.render('event/newEvent', {
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
      const newEvent = await createEvent(req.body);
      logger.db(`Event ${newEvent.name} created by user ${req.user.username}.`);
      req.session.successMessage = 'Event created successfully!';
      res.redirect('/admin/event/dashboard');
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);

      const errorMessage = err.errors
        ? Object.values(err.errors).map(e => e.message).join(' ')
        : (err.message || 'Server error');

      return res.render('event/newEvent', {
        permissionList: await getAllPermissions(),
        formData: req.body,
        successMessage: null,
        failMessage: errorMessage,
        card: { ...req.body, _id: req.params.id },
        user: req.user
      });
    }
  }

  dashboard = async (req, res) => {
    const events = await getAllEvents();
    logger.debug(req.session.successMessage);
    res.render('event/eventdash', {
      events,
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
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/admin/event/dashboard');
    }
  }

  editPost = async (req, res) => {
    try {
      const event = await updateEvent(req.params.id, req.body);
      logger.db(`Event ${event.name} updated by user ${req.user.username}.`);
      req.session.successMessage = 'Event updated successfully!';
      res.redirect('/admin/event/dashboard');
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);

      const errorMessage = err.errors
        ? Object.values(err.errors).map(e => e.message).join(' ')
        : (err.message || 'Server error');

      return res.render('event/editEvent', {
        permissionList: await getAllPermissions(),
        formData: { ...req.body, _id: req.params.id },
        successMessage: null,
        failMessage: errorMessage,
        user: req.user
      });
    }
  }

  details = async (req, res) => {
    try {
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
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/event/dashboard');
    }
  }

  deleteResponsiblePerson = async (req, res) => {
    try {
      const event = await deleteResponsiblePerson(req.params.id, req.body);
      logger.db(`Responsible person ${req.body.name} from event ${event.EventName} deleted by user ${req.user.username}.`);
      res.status(200).json({ message: `${req.body.name} responsible person deleted successfully by ${req.user.username}` });
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      req.session.failMessage = err.message || 'Server error';
      res.status(500).json({ message: err.message || 'Server error' });
    }
  }

  addResponsiblePerson = async (req, res) => {
    try {
      const event = await addResponsiblePerson(req.params.id, req.body);
      logger.db(`Responsible person added to event ${event.EventName} by user ${req.user.username}.`);
      res.status(200).json({ message: 'Responsible person added successfully!' });
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      const errorMessage = err.errors
        ? Object.values(err.errors).map(e => e.message).join(' ')
        : (err.message || 'Server error');
      req.session.failMessage = errorMessage;
      res.status(500).json({ message: errorMessage });
    }
  }

  selectEvent = async (req, res) => {
    try {
      const event = await selectEvent(req.params.eventId);
      logger.db(`Event ${event.EventName} selected by user ${req.user.username}.`);
      req.session.selectedEvent = event._id;
      req.session.successMessage = 'Event selected successfully! ' + event.EventName;
      res.status(200).json({ message: 'Event selected successfully! ' + event.EventName });
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);
      return res.status(500).json({ message: err.message || 'Server error' });
    }
  }
}

export default new EventController();
