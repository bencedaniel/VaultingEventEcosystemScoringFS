import { logger, logOperation, logAuth, logError, logValidation, logWarn, logDebug } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HTTP_STATUS, MESSAGES } from '../config/index.js';
import { 
    getAllScoreSheetTemplates, 
    getScoreSheetTemplateById, 
    getAllCategories, 
    getCategoriesByIds, 
    createScoreSheetTemplate, 
    updateScoreSheetTemplate, 
    deleteScoreSheetTemplate, 
    parseJSONArrayField, 
    validateCategoriesAgegroup, 
    deleteImageFile 
} from '../DataServices/scoreSheetTemplateData.js';

/**
 * @route GET /scoresheets/dashboard
 * @desc Show score sheet templates dashboard
 */
const getScoreSheetTemplatesDashboard = asyncHandler(async function (req, res) {
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
});

/**
 * @route GET /scoresheets/create
 * @desc Show create score sheet template form
 */
const getCreateScoreSheetTemplateForm = asyncHandler(async function (req, res) {
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
});

/**
 * @route POST /scoresheets/create
 * @desc Create new score sheet template
 */
const createNewScoreSheetTemplate = async function (req, res) {
    const forerr = req.body;
    logDebug('POST /create body', JSON.stringify(req.body));
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
        req.session.successMessage = MESSAGES.SUCCESS.SCORE_SHEET_TEMPLATE_CREATED;
        return res.redirect('/scoresheets/dashboard');
    } catch (err) {
        logError('SHEET_CREATION_ERROR', err?.message || String(err), `User: ${req.user.username}`);
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
};

/**
 * @route GET /scoresheets/edit/:id
 * @desc Show edit score sheet template form
 */
const getEditScoreSheetTemplateForm = asyncHandler(async function (req, res) {
    const sheet = await getScoreSheetTemplateById(req.params.id);
    if (!sheet) {
        req.session.failMessage = MESSAGES.ERROR.TEMPLATE_NOT_FOUND;
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
});

/**
 * @route POST /scoresheets/edit/:id
 * @desc Update score sheet template
 */
const updateScoreSheetTemplateById = asyncHandler(async function (req, res) {
        const categories = await getCategoriesByIds(req.body.Category);
        validateCategoriesAgegroup(categories);

        const old = await getScoreSheetTemplateById(req.params.id);
        if (!old) {
            req.session.failMessage = MESSAGES.ERROR.TEMPLATE_NOT_FOUND;
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

        req.session.successMessage = MESSAGES.SUCCESS.SCORE_SHEET_TEMPLATE_UPDATED;
        return res.redirect('/scoresheets/dashboard');
    
} );

/**
 * @route DELETE /scoresheets/delete/:id
 * @desc Delete score sheet template
 */
const deleteScoreSheetTemplateById = asyncHandler(async function (req, res) {
    const sheet = await deleteScoreSheetTemplate(req.params.id);
    if (!sheet) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: MESSAGES.ERROR.TEMPLATE_NOT_FOUND });
    return res.status(HTTP_STATUS.OK).json({ message: MESSAGES.SUCCESS.SCORE_SHEET_TEMPLATE_UPDATED });
});

export default {
    getScoreSheetTemplatesDashboard,
    getCreateScoreSheetTemplateForm,
    createNewScoreSheetTemplate,
    getEditScoreSheetTemplateForm,
    updateScoreSheetTemplateById,
    deleteScoreSheetTemplateById
};
