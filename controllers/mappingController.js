import { logger } from '../logger.js';
import {
  getAllMappings,
  getMappingById,
  createMapping,
  updateMapping,
  deleteMapping,
  getAllPermissions
} from '../services/mappingData.js';

class MappingController {
  renderNew = (req, res) => {
    res.render('mapping/newTablemapping', {
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
      const newMapping = await createMapping(req.body);
      logger.db(`Mapping ${newMapping._id} created by user ${req.user.username}.`);
      req.session.successMessage = 'Mapping created successfully!';
      res.redirect('/mapping/dashboard');
    } catch (err) {
      logger.error(err + " User: "+ req.user.username);

      const errorMessage = err.errors
        ? Object.values(err.errors).map(e => e.message).join(' ')
        : 'Server error';

      return res.render('mapping/newMapping', {
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
    try {
      const mappings = await getAllMappings();
      res.render('mapping/tablemappingdash', {
        mappings,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
      });
      req.session.failMessage = null;
      req.session.successMessage = null;
    } catch (err) {
      logger.error(err + " User: " + req.user.username);
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/dashboard');
    }
  }

  editGet = async (req, res) => {
    try {
      const mapping = await getMappingById(req.params.id);
      res.render('mapping/editTablemapping', {
        formData: mapping,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
      });
      req.session.failMessage = null;
      req.session.successMessage = null;
    } catch (err) {
      logger.error(err + " User: " + req.user.username);
      req.session.failMessage = err.message || 'Server error';
      return res.redirect('/mapping/dashboard');
    }
  }

  editPost = async (req, res) => {
    try {
      const mapping = await updateMapping(req.params.id, req.body);
      logger.db(`Mapping ${mapping._id} updated by user ${req.user.username}.`);
      req.session.successMessage = 'Mapping updated successfully!';
      res.redirect('/mapping/dashboard');
    } catch (err) {
      logger.error(err + " User: " + req.user.username);

      const errorMessage = err.errors
        ? Object.values(err.errors).map(e => e.message).join(' ')
        : (err.message || 'Server error');

      return res.render('mapping/editMapping', {
        formData: { ...req.body, _id: req.params.id },
        successMessage: null,
        failMessage: errorMessage,
        user: req.user
      });
    }
  }

  delete = async (req, res) => {
    try {
      const mapping = await deleteMapping(req.params.id);
      logger.db(`Mapping ${mapping._id} deleted by user ${req.user.username}.`);
      req.session.successMessage = 'Mapping deleted successfully!';
      res.status(200).json({ message: 'Mapping deleted successfully' });
    } catch (err) {
      logger.error(err + " User: " + req.user.username);
      req.session.failMessage = err.message || 'Server error';
      res.status(500).json({ message: err.message || 'Server error' });
    }
  }
}

export default new MappingController();
