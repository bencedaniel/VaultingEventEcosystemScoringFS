import express from 'express';
import { logger } from '../logger.js';
import { Verify, VerifyRole } from '../middleware/Verify.js';
import Validate from '../middleware/Validate.js';
import ScoreSheetTemp from '../models/ScoreSheetTemp.js';
import Category from '../models/Category.js';
import { uploadImage } from '../middleware/fileUpload.js';
import path from 'path';
import fs from 'fs/promises';

const ScoreSheetTempRouter = express.Router();

const uploadsDir = path.join(process.cwd(), 'static', 'uploads');

function toAbsoluteFromStaticUrl(urlPath) {
  if (!urlPath) return null;
  // támogat teljes http(s) URL-t is
  let p = urlPath;
  if (/^https?:\/\//i.test(urlPath)) {
    try { p = new URL(urlPath).pathname; } catch { return null; }
  }
  if (!p.startsWith('/static/uploads/')) return null;
  // '/static/uploads/..' -> '<cwd>/static/uploads/..'
  return path.resolve(process.cwd(), p.replace(/^\//, ''));
}

function isInsideUploads(absPath) {
  if (!absPath) return false;
  const rel = path.relative(uploadsDir, absPath);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

async function deleteImageFile(staticUrl) {
  const abs = toAbsoluteFromStaticUrl(staticUrl);
  if (!abs) { logger.warn(`Skip delete (not static uploads): ${staticUrl}`); return; }
  if (!isInsideUploads(abs)) { logger.warn(`Skip delete (outside uploads): ${abs}`); return; }
  try {
    await fs.unlink(abs);
    logger.db(`Deleted file: ${abs}`);
  } catch (e) {
    logger.warn(`Delete failed or file missing: ${abs} -> ${e.message}`);
  }
}

// List (dashboard)
ScoreSheetTempRouter.get('/dashboard', Verify, VerifyRole(), async (req, res) => {
  try {
    const sheets = await ScoreSheetTemp.find()
      .populate('CategoryId');

    res.render('SStemp/dashboard', {
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
       const   categorys=  await Category.find().sort({ Star: 1 })

    res.render('SStemp/newScoreSheet', {
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

// helper: safely parse JSON array fields coming from form hidden inputs
function parseJSONArrayField(value, fieldName) {
  if (!value) return [];
  if (Array.isArray(value)) return value; // already parsed (in case of nested field names)
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error(`${fieldName} must be an array`);
    // add width value to position object
    return parsed.map(field => ({
      ...field,
      position: {
        ...field.position,
        w: field.width
      }
    }));
  } catch (e) {
    throw new Error(`${fieldName} parse error: ${e.message}`);
  }
}

ScoreSheetTempRouter.post('/create', Verify, VerifyRole(), uploadImage.single('bgImageFile'), async (req, res) => {

  const forerr = req.body;
  logger.debug('POST /create body: ' + JSON.stringify(req.body)); // improved logging
  try {


    const outputFieldList = parseJSONArrayField(req.body.outputFieldList, 'outputFieldList');
    const inputFieldList  = parseJSONArrayField(req.body.inputFieldList,  'inputFieldList');
     const bgImage = req.file
      ? `/static/uploads/${req.file.filename}`
      : (req.body.bgImage || ''); // fallback, ha nem töltött fel


    const payload = {
      TestType: req.body.TestType,
      typeOfScores: req.body.typeOfScores,
      numberOfJudges: Number(req.body.numberOfJudges),
      CategoryId: req.body.Category,
      outputFieldList,
      inputFieldList,
      bgImage: bgImage
    };

    const sheet = new ScoreSheetTemp(payload);
    await sheet.save();

    logger.db(`ScoreSheetTemp ${sheet._id} created by user ${req.user.username}.`);
    req.session.successMessage = 'Template created successfully!';
    return res.redirect('/scoresheets/dashboard');
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);

    const errorMessage = err?.code === 11000
      ? 'Duplicate template combination (TestType, typeOfScores, numberOfJudges, CategoryId).'
      : (err?.message || 'Server error');

    return res.render('SStemp/newScoreSheet', {
      categorys: await Category.find().sort({ Star: 1 }),

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
    const sheet = await ScoreSheetTemp.findById(req.params.id).populate('CategoryId');
    if (!sheet) {
      req.session.failMessage = 'Template not found';
      return res.redirect('/scoresheets/dashboard');
    }

    const categorys = await Category.find().sort({ Star: 1 });
    res.render('SStemp/editScoreSheet', {
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
    const categories = await Category.find({ _id: { $in: req.body.Category } });
    if (categories.length === 0) {
      throw new Error('Selected category does not exist');
    }

    const firstType = categories[0].Type;
    const hasMixedAgegroup = categories.some(c => c.Type !== firstType);
    if (hasMixedAgegroup) {
      const missmatched = categories.filter(c => c.Type !== firstType).map(c => c.CategoryDispName).join(', ');
      req.session.failMessage = 'Selected categories must be of the same Agegroup type. Mismatched: ' + missmatched;
      logger.warn(`ScoreSheetTemp edit failed due to mismatched Agegroup categories by user ${req.user.username}. First Agegroup: ${firstType}`);
      return res.redirect('/scoresheets/edit/' + req.params.id);
      
    }
    

    const old = await ScoreSheetTemp.findById(req.params.id);
    if (!old) {
      req.session.failMessage = 'Template not found';
      return res.redirect('/scoresheets/dashboard');
    }

    const outputFieldList = parseJSONArrayField(req.body.outputFieldList, 'outputFieldList');
    const inputFieldList  = parseJSONArrayField(req.body.inputFieldList,  'inputFieldList');

    const newBgImage = req.file
      ? `/static/uploads/${req.file.filename}`
      : (req.body.bgImage || old.bgImage || '');

    const sheet = await ScoreSheetTemp.findByIdAndUpdate(
      req.params.id,
      {
        TestType: req.body.TestType,
        typeOfScores: req.body.typeOfScores,
        numberOfJudges: Number(req.body.numberOfJudges),
        CategoryId: req.body.Category,
        outputFieldList,
        inputFieldList,
        bgImage: newBgImage
      },
      { runValidators: true, new: true }
    );

    // ha új fájl jött és változott az URL, töröljük a régit
    if (req.file && old.bgImage && old.bgImage !== newBgImage) {
      await deleteImageFile(old.bgImage);
    }

    logger.db(`ScoreSheetTemp ${sheet._id} updated by user ${req.user.username}.`);
    req.session.successMessage = 'Template updated successfully!';
    return res.redirect('/scoresheets/dashboard');
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    const errorMessage = err?.code === 11000 ? 'Duplicate template combination.' : (err?.message || 'Server error');
    const categorys = await Category.find().sort({ Star: 1 });
    return res.render('SStemp/editScoreSheet', {
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
    const sheet = await ScoreSheetTemp.findByIdAndDelete(req.params.id);
    if (!sheet) return res.status(404).json({ message: 'Template not found' });

    if (sheet.bgImage) {
      await deleteImageFile(sheet.bgImage);
    }

    logger.db(`ScoreSheetTemp ${sheet._id} deleted by user ${req.user.username}.`);
    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (err) {
    logger.error(err + ' User: ' + req.user.username);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default ScoreSheetTempRouter;