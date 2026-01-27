import { logger } from '../logger.js';
import { FirstLevel, SecondLevel, TotalLevel } from '../services/resultCalculations.js';
import {
    getResultGroupsForResults,
    getResultGroupWithDetails
} from '../services/resultGroupData.js';

/**
 * @route GET /result/
 * @desc Show results dashboard
 */
async function getResultsDashboard(req, res) {
    try {
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
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/result/groups/dashboard');
    }
};

/**
 * @route GET /result/detailed/:id/:part
 * @desc Show detailed results for a specific result group and part
 */
async function getDetailedResults(req, res) {
    try {
        const resultGroupDoc = await getResultGroupWithDetails(req.params.id);

        if (!resultGroupDoc) {
            req.session.failMessage = "Result group not found.";
            return res.redirect("/result");
        }
        if((req.params.part === 'R1F' && !resultGroupDoc.round1First) ||
           (req.params.part === 'R1S' && !resultGroupDoc.round1Second) ||
           (req.params.part === 'R2F' && !resultGroupDoc.round2First)){
            req.session.failMessage = "Selected timetable part is not defined for this result group.";
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
            req.session.failMessage = "Invalid timetable part specified.";
            return res.redirect("/result");
        }
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: "+ req.user.username);
      
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/result/groups/dashboard');
    }
};

export default {
    getResultsDashboard,
    getDetailedResults
};
