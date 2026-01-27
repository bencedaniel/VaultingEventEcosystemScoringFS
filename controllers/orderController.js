import { logger } from '../logger.js';
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
} from '../services/orderData.js';

class OrderController {
  editGet = async (req, res) => {
    try {
      const timetablePart = await getTimetablePartById(req.params.id);
      const eventID = res.locals.selectedEvent?._id;

      if (!timetablePart.StartingOrder.length === 0 || timetablePart.drawingDone === false) {
        req.session.failMessage = "No starting order set for this timetable part.";
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

    } catch (err) {
      logger.error(err + " User: " + req.user.username);
      req.session.failMessage = err.message || 'Hiba történt.';
      return res.redirect('/dailytimetable');
    }
  }

  overwrite = async (req, res) => {
    try {
      const timetablePart = await updateStartingOrder(req.params.id, {
        entryId: req.body.id,
        newOrder: req.body.newOrder
      });

      logger.db(`Order overwritten: TimetablePart ${timetablePart._id}, Entry ${req.body.id} set to Order ${req.body.newOrder}`);
      req.session.successMessage = 'Starting order updated successfully.';
      return res.status(200).json({ message: 'Starting order updated successfully.' });

    } catch (err) {
      logger.error(err + " User: " + req.user.username);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  createOrder = async (req, res) => {
    try {
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
    } catch (err) {
      logger.error(err + " User: " + req.user.username);
      req.session.failMessage = 'Error occurred.';
      return res.redirect('/dailytimetable');
    }
  }

  confirmConflicts = async (req, res) => {
    try {
      await updateTimetablePartStatus(req.params.id, { conflictsChecked: true });

      req.session.successMessage = 'Conflicts confirmed. You can now create the starting order.';
      return res.redirect('/order/createOrder/' + req.params.id);

    } catch (err) {
      logger.error(err + " User: " + req.user.username);
      req.session.failMessage = 'Error occurred.';
      return res.redirect('/dailytimetable');
    }
  }

  getNewOrder = async (req, res) => {
    try {
      const timetablePart = await getTimetablePartById(req.params.id);
      const eventID = res.locals.selectedEvent?._id;

      const categories = parseCategoriesArray(timetablePart.Category);
      const entries = await getEntriesForCategories(eventID, categories);

      const randomnumber = await generateNewOrderNumber(timetablePart, entries.length, req.body.oldNumber);

      await updateEntryOrderNumber(req.params.id, req.body.id, randomnumber);

      logger.db(`Order re-generated: TimetablePart ${req.params.id}, Entry ${req.body.id} set to Order ${randomnumber}`);

      return res.status(200).json({ newOrder: randomnumber });

    } catch (err) {
      logger.error(err + " User: " + req.user.username);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }

  createSelectGet = async (req, res) => {
    try {
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
    } catch (err) {
      logger.error(err + " User: " + req.user.username);
      req.session.failMessage = 'Error occurred.';
      return res.redirect('/dailytimetable');
    }
  }

  createSelectPost = async (req, res) => {
    try {
      if (!req.body.creationMethod || (req.body.creationMethod !== 'Drawing' && req.body.creationMethod !== 'Copy')) {
        req.session.failMessage = "Invalid creation method selected.";
        return res.redirect('/order/createSelect/' + req.params.id);
      }

      if (req.body.creationMethod === 'Drawing') {
        await updateTimetablePartStatus(req.params.id, { StartingOrder: [] });
        return res.redirect('/order/createOrder/' + req.params.id);

      } else if (req.body.creationMethod === 'Copy') {
        req.session.failMessage = "Copy method not implemented yet.";
        return res.redirect('/order/createSelect/' + req.params.id);
      }

    } catch (err) {
      logger.error(err + " User: " + req.user.username);
      req.session.failMessage = 'Error occurred.';
      try {
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
      } catch (innerErr) {
        logger.error(innerErr + " User: " + req.user.username);
        return res.redirect('/dailytimetable');
      }
    }
  }
}

export default new OrderController();
