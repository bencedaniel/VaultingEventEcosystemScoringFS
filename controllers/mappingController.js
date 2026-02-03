import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import {
  getAllMappings,
  getMappingById,
  createMapping,
  updateMapping,
  deleteMapping,
  getAllPermissions
} from '../DataServices/mappingData.js';


const renderNew = (req, res) => {
  res.render('mapping/newTablemapping', {
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
  const newMapping = await createMapping(req.body);
  logOperation('MAPPING_CREATE', `Mapping created: ${newMapping._id}`, req.user.username, HTTP_STATUS.CREATED);
  req.session.successMessage = MESSAGES.SUCCESS.MAPPING_CREATED;
  res.redirect('/mapping/dashboard');
});

const dashboard = asyncHandler(async (req, res) => {
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
});

const editGet = asyncHandler(async (req, res) => {
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
});

const editPost = asyncHandler(async (req, res) => {
  const mapping = await updateMapping(req.params.id, req.body);
  logOperation('MAPPING_UPDATE', `Mapping updated: ${mapping._id}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.MAPPING_UPDATED;
  res.redirect('/mapping/dashboard');
});

const delete_ = asyncHandler(async (req, res) => {
  const mapping = await deleteMapping(req.params.id);
  logOperation('MAPPING_DELETE', `Mapping deleted: ${mapping._id}`, req.user.username, HTTP_STATUS.OK);
  req.session.successMessage = MESSAGES.SUCCESS.MAPPING_DELETED;
  res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.MAPPING_DELETED });
});

export default {
  renderNew,
  createNew,
  dashboard,
  editGet,
  editPost,
  delete: delete_
};
