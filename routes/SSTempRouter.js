import express from 'express';
import { logger } from '../logger.js';
import { Verify, VerifyRole } from '../middleware/Verify.js';
import Validate from '../middleware/Validate.js';
import { uploadImage } from '../middleware/fileUpload.js';
import { getAllScoreSheetTemplates, getScoreSheetTemplateById, getAllCategories, getCategoriesByIds, createScoreSheetTemplate, updateScoreSheetTemplate, deleteScoreSheetTemplate, parseJSONArrayField, validateCategoriesAgegroup, deleteImageFile } from '../services/scoreSheetTemplateData.js';

const ScoreSheetTempRouter = express.Router();

// List (dashboard)
ScoreSheetTempRouter.get('/dashboard', Verify, VerifyRole(), async (req, res) => {
  try {
    const sheets = await getAllScoreSheetTemplates();

    res.render('ssTemp/dashboard', {
      ssTemps: sheets,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    req.session.failMessage = 'Server error';
    return res.redirect('/admin/dashboard');
  }
});

ScoreSheetTempRouter.get('/create', Verify, VerifyRole(), async (req, res) => {
  try {
    const categorys = await getAllCategories();

    res.render('ssTemp/newScoreSheet', {
      categorys: categorys,
      formData: req.session.formData,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    req.session.failMessage = 'Server error';
    return res.redirect('/scoresheets/dashboard');
  }
});

ScoreSheetTempRouter.post('/create', Verify, VerifyRole(), uploadImage.single('bgImageFile'), async (req, res) => {
  const forerr = req.body;
  logger.debug('POST /create body: ' + JSON.stringify(req.body));
  try {
    const outputFieldList = parseJSONArrayField(req.body.outputFieldList, 'outputFieldList');
    const inputFieldList = parseJSONArrayField(req.body.inputFieldList, 'inputFieldList');
    const bgImage = req.file
      ? `/static/uploads/${req.file.filename}`
      : (req.body.bgImage || '');

    const payload = {
      TestType: req.body.TestType,
      typeOfScores: req.body.typeOfScores,
      numberOfJudges: Number(req.body.numberOfJudges),
      CategoryId: req.body.Category,
      outputFieldList,
      inputFieldList,
      bgImage: bgImage
    };

    const sheet = await createScoreSheetTemplate(payload);
    req.session.successMessage = 'Template created successfully!';
    return res.redirect('/scoresheets/dashboard');
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    const errorMessage = err?.code === 11000
      ? 'Duplicate template combination (TestType, typeOfScores, numberOfJudges, CategoryId).'
      : (err?.message || 'Server error');

    return res.render('ssTemp/newScoreSheet', {
      categorys: await getAllCategories(),
      formData: forerr,
      rolePermissons: req.user?.role?.permissions,
      failMessage: errorMessage,
      successMessage: null,
      user: req.user
    });
  }
});



// Edit (form)
ScoreSheetTempRouter.get('/edit/:id', Verify, VerifyRole(), async (req, res) => {
  try {
    const sheet = await getScoreSheetTemplateById(req.params.id);
    if (!sheet) {
      req.session.failMessage = 'Template not found';
      return res.redirect('/scoresheets/dashboard');
    }

    const categorys = await getAllCategories();
    res.render('ssTemp/editScoreSheet', {
      categorys: categorys,
      formData: sheet,
      rolePermissons: req.user?.role?.permissions,
      failMessage: req.session.failMessage,
      successMessage: req.session.successMessage,
      user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    req.session.failMessage = 'Server error';
    return res.redirect('/scoresheets/dashboard');
  }
});

// Update
ScoreSheetTempRouter.post('/edit/:id', Verify, VerifyRole(), uploadImage.single('bgImageFile'), async (req, res) => {
  const forerr = { ...req.body, _id: req.params.id, CategoryId: req.body.Category };

  try {
    const categories = await getCategoriesByIds(req.body.Category);
    validateCategoriesAgegroup(categories);

    const old = await getScoreSheetTemplateById(req.params.id);
    if (!old) {
      req.session.failMessage = 'Template not found';
      return res.redirect('/scoresheets/dashboard');
    }

    const outputFieldList = parseJSONArrayField(req.body.outputFieldList, 'outputFieldList');
    const inputFieldList = parseJSONArrayField(req.body.inputFieldList, 'inputFieldList');

    const newBgImage = req.file
      ? `/static/uploads/${req.file.filename}`
      : (req.body.bgImage || old.bgImage || '');

    const sheet = await updateScoreSheetTemplate(req.params.id, {
      TestType: req.body.TestType,
      typeOfScores: req.body.typeOfScores,
      numberOfJudges: Number(req.body.numberOfJudges),
      CategoryId: req.body.Category,
      outputFieldList,
      inputFieldList,
      bgImage: newBgImage
    });

    // ha új fájl jött és változott az URL, töröljük a régit
    if (req.file && old.bgImage && old.bgImage !== newBgImage) {
      await deleteImageFile(old.bgImage);
    }

    req.session.successMessage = 'Template updated successfully!';
    return res.redirect('/scoresheets/dashboard');
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    const errorMessage = err?.code === 11000 ? 'Duplicate template combination.' : (err?.message || 'Server error');
    const categorys = await getAllCategories();
    return res.render('ssTemp/editScoreSheet', {
      categorys: categorys,
      formData: forerr,
      rolePermissons: req.user?.role?.permissions,
      failMessage: errorMessage,
      successMessage: null,
      user: req.user
    });
  }
});

// Delete
ScoreSheetTempRouter.delete('/delete/:id', Verify, VerifyRole(), async (req, res) => {
  try {
    const sheet = await deleteScoreSheetTemplate(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'Template not found' });
    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default ScoreSheetTempRouter;