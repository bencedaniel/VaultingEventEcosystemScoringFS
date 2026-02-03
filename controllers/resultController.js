import { logger, logOperation, logAuth, logError, logValidation, logWarn } from '../logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { MESSAGES } from '../config/index.js';
import { FirstLevel, SecondLevel, TotalLevel } from '../LogicServices/resultCalculations.js';
import {
    getResultGroupsForResults,
    getResultGroupWithDetails
} from '../DataServices/resultGroupData.js';

/**
 * @route GET /result/
 * @desc Show results dashboard
 */
const getResultsDashboard = asyncHandler(async (req, res) => {
    const resultGroups = await getResultGroupsForResults(res.locals.selectedEvent?._id);
    res.render("results/dashboard", {
        resultGroups: resultGroups,
        rolePermissons: req.user?.role?.permissions,
        failMessage: req.session.failMessage,
        successMessage: req.session.successMessage,
        user: req.user
    });
    req.session.failMessage = null;
    req.session.successMessage = null;
});

/**
 * @route GET /result/detailed/:id/:part
 * @desc Show detailed results for a specific result group and part
 */
const getDetailedResults = asyncHandler(async (req, res) => {
    const resultGroupDoc = await getResultGroupWithDetails(req.params.id);

    if (!resultGroupDoc) {
        req.session.failMessage = MESSAGES.ERROR.RESULT_GROUP_NOT_FOUND;
        return res.redirect("/result");
    }
    if((req.params.part === 'R1F' && !resultGroupDoc.round1First) ||
       (req.params.part === 'R1S' && !resultGroupDoc.round1Second) ||
       (req.params.part === 'R2F' && !resultGroupDoc.round2First)){
        req.session.failMessage = MESSAGES.ERROR.TIMETABLE_PART_NOT_DEFINED;
        return res.redirect("/result");
    }
    if(['R1F', 'R1S', 'R2F'].includes(req.params.part)){
    
        const data =  await FirstLevel(resultGroupDoc,req.params.part);

        res.render("results/detailedResults", {
            title: resultGroupDoc.category.CategoryDispName + " -- " + data.title,
            resultGroup: resultGroupDoc,
            pointDetailsLevel: 1,
            param: req.params.part,
            results: data.results.sort((a, b) => b.TotalScore - a.TotalScore),
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
    else if(['R1', 'R2'].includes(req.params.part)){

        const data = await SecondLevel(resultGroupDoc,req.params.part);

        res.render("results/detailedResults", {
            title: resultGroupDoc.category.CategoryDispName + " -- " + data.title,
            resultGroup: resultGroupDoc,
            pointDetailsLevel: 2,
            results: data.results.sort((a, b) => b.TotalScore - a.TotalScore),
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });

    } else if(req.params.part === 'total'){
        const data = await TotalLevel(resultGroupDoc);
        
        res.render("results/detailedResults", {
            title: resultGroupDoc.category.CategoryDispName + " -- Total Results",
            resultGroup: resultGroupDoc,
            pointDetailsLevel: 3,
            results: data.results.sort((a, b) => b.TotalScore - a.TotalScore),
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
     else {
        req.session.failMessage = MESSAGES.ERROR.INVALID_TIMETABLE_PART;
        return res.redirect("/result");
    }
    req.session.failMessage = null;
    req.session.successMessage = null;
});

export default {
    getResultsDashboard,
    getDetailedResults
};
