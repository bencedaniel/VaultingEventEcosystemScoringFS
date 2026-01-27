import express from 'express';

import {logger} from '../logger.js';
import { Verify, VerifyRole } from "../middleware/Verify.js";
import { FirstLevel, SecondLevel, TotalLevel } from '../services/resultCalculations.js';
import {
    getAllCalcTemplates,
    getCalcTemplateById,
    createCalcTemplate,
    updateCalcTemplate,
    deleteCalcTemplate,
    getCalcTemplateFormData
} from '../services/resultCalcTemplateData.js';
import {
    getAllGenerators,
    getGeneratorFormData,
    createGenerator,
    updateGenerator,
    updateGeneratorStatus,
    getGeneratorById,
    deleteGenerator
} from '../services/resultGeneratorData.js';
import {
    getResultGroupsByEvent,
    getResultGroupsForResults,
    getResultGroupById,
    getResultGroupWithDetails,
    getGroupFormData,
    updateResultGroup,
    createResultGroup,
    deleteResultGroup,
    generateGroupsForActiveGenerators
} from '../services/resultGroupData.js';


const resultRouter = express.Router();

resultRouter.get("/calcTemp/dashboard", Verify, VerifyRole(), async (req, res) => {
    try {
        res.render("resultCalc/dashboard", {
            resultCalcs: await getAllCalcTemplates(),
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
        return res.redirect('/dashboard');
    }
});
resultRouter.get("/calcTemp/new", Verify, VerifyRole(), async (req, res) => {
    try {
        const { categories } = await getCalcTemplateFormData();
        res.render("resultCalc/newResultCalc", {
            formData: req.session.formData || {},
            categoryList: categories,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null; // Üzenet törlése a session-ből  
        req.session.successMessage = null; // Üzenet törlése a session-ből
    } catch (err) {
        logger.error(err + " User: "+ req.user.username);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
      


          req.session.failMessage = errorMessage;
          return res.redirect('/result/calcTemp/dashboard')

         
        

    }
});
resultRouter.post("/calcTemp/new", Verify, VerifyRole(), async (req, res) => {
    try {

        if(Number(req.body.round2FirstP)+Number(req.body.round1FirstP)+Number(req.body.round1SecondP) !==100){
            req.session.failMessage = "The sum of the percentages must be 100%.";
            req.session.formData = req.body;
            return res.redirect("/result/calcTemp/new");
            
        }
        const calcTemp = await createCalcTemplate(req.body);
        logger.db(`Result calculation template ${calcTemp._id} created by user ${req.user.username}.`);
        req.session.successMessage = "Result calculation template created successfully.";
        res.redirect("/result/calcTemp/dashboard");
    } catch (err) {
        logger.error(err + " User: "+ req.user.username);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
      


            return res.render("resultCalc/newResultCalc", {
                        formData: req.body,
                        categoryList: categories,
                        rolePermissons: req.user?.role?.permissions,
                        failMessage: errorMessage,
                        successMessage: req.session.successMessage,
                        user: req.user
                });


    }

});
resultRouter.get("/calcTemp/edit/:id", Verify, VerifyRole(), async (req, res) => {
    try {
        const calcTemp = await getCalcTemplateById(req.params.id);
        res.render("resultCalc/editResultCalc", {
            formData: calcTemp,
            rolePermissons: req.user?.role?.permissions,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null; // Üzenet törlése a session-ből  
        req.session.successMessage = null; // Üzenet törlése a session-ből
    } catch (err) {
        logger.error(err + " User: "+ req.user.username);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
      


          req.session.failMessage = errorMessage;
          return res.redirect('/result/calcTemp/dashboard')

    }
});

resultRouter.post("/calcTemp/edit/:id", Verify, VerifyRole(), async (req, res) => {
    try {
         if( Number(req.body.round2FirstP)+Number(req.body.round1FirstP)+Number(req.body.round1SecondP) !=100){
            const sum = Number(req.body.round2FirstP)+Number(req.body.round1FirstP)+Number(req.body.round1SecondP);
            logger.error('Percentage sum error by user: ' + req.user.username + sum);
            req.session.failMessage = "The sum of the percentages must be 100%.";
            return res.redirect("/result/calcTemp/edit/" + req.params.id);

        }
        const updated = await updateCalcTemplate(req.params.id, req.body);
        

        logger.db(`Result calculation template ${updated?._id || req.params.id} edited by user ${req.user.username}.`);
        req.session.successMessage = "Result calculation template edited successfully.";
        res.redirect("/result/calcTemp/dashboard");
    } catch (err) {
        logger.error(err + " User: "+ req.user.username);
      
          const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
      


            return res.render("resultCalc/editResultCalc", {
                        formData: { ...req.body, _id: req.params.id },
                        rolePermissons: req.user?.role?.permissions,
                        failMessage: errorMessage,
                        successMessage: req.session.successMessage,
                        user: req.user

    });
    }

});


resultRouter.delete("/calcTemp/delete/:id", Verify, VerifyRole(), async (req, res) => {
    try {
        await deleteCalcTemplate(req.params.id);
        logger.db(`Result calculation template ${req.params.id} deleted by user ${req.user.username}.`);
        res.status(200).send("Calculation template deleted successfully.");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : (err.message || 'Server error');
        req.session.failMessage = errorMessage;
        return res.status(400).send(errorMessage);
    }
});


//Result Generator

resultRouter.get("/generator/dashboard", Verify, VerifyRole(), async (req, res) => {
    try {
        const generators = await getAllGenerators();
        res.render("resultGen/dashboard", {
            generators: generators,
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
        return res.redirect('/dashboard');
    }
});

resultRouter.get("/generator/new", Verify, VerifyRole(), async (req, res) => {
    try {
        const { categories, calcTemplates } = await getGeneratorFormData();
        res.render("resultGen/newResultGen", {
            formData: req.session.formData || {},
            categories: categories,
            resultCalcs: calcTemplates,
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
        return res.redirect('/result/generator/dashboard');
    }
});

resultRouter.post("/generator/new", Verify, VerifyRole(), async (req, res) => {
    try {
        const newGenerator = await createGenerator(req.body);
        logger.db(`Result generator ${newGenerator._id} created by user ${req.user.username}.`);
        req.session.successMessage = "Result generator created successfully.";
        res.redirect("/result/generator/dashboard");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        const { categories, calcTemplates } = await getGeneratorFormData();
        return res.render("resultGen/newResultGen", {
            formData: req.body,
            categories: categories,
            resultCalcs: calcTemplates,
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
});


resultRouter.post("/generator/status/:id", Verify, VerifyRole(), async (req, res) => {
    try {
        const generator = await updateGeneratorStatus(req.params.id, req.body.status);
        logger.db(`Result generator ${generator._id} status updated to ${req.body.status} by user ${req.user.username}.`);
        res.status(200).send("Result generator status updated successfully.");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        req.session.failMessage = errorMessage;
        return res.status(500).send("Error updating result generator status. " + errorMessage);
    }
});


resultRouter.get("/generator/edit/:id", Verify, VerifyRole(), async (req, res) => {
    try {
        const generator = await getGeneratorById(req.params.id);
        const { categories, calcTemplates } = await getGeneratorFormData();
        res.render("resultGen/editResultGen", {
            formData: generator,
            categories: categories,
            resultCalcs: calcTemplates,
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
        return res.redirect('/result/generator/dashboard');
    }
});

resultRouter.post("/generator/edit/:id", Verify, VerifyRole(), async (req, res) => {
    try {
        const generator = await updateGenerator(req.params.id, req.body);
        logger.db(`Result generator ${generator._id} edited by user ${req.user.username}.`);
        req.session.successMessage = "Result generator edited successfully.";
        res.redirect("/result/generator/dashboard");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        const { categories, calcTemplates } = await getGeneratorFormData();
        return res.render("resultGen/editResultGen", {
            formData: { ...req.body, _id: req.params.id },
            categories: categories,
            resultCalcs: calcTemplates,
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
});

resultRouter.delete("/generator/delete/:id", Verify, VerifyRole(), async (req, res) => {
    try {
        const generator = await deleteGenerator(req.params.id);
        logger.db(`Result generator ${generator._id} deleted by user ${req.user.username}.`);
        res.status(200).send("Result generator deleted successfully.");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/result/generator/dashboard');
    }
});


// Result Groups

resultRouter.get("/groups/dashboard", Verify, VerifyRole(), async (req, res) => {
    try {
        const resultGroups = await getResultGroupsByEvent(res.locals.selectedEvent?._id);
        res.render("resultGroup/dashboard", {
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
        return res.redirect('/dashboard');
    }
});

resultRouter.get("/groups/edit/:id", Verify, VerifyRole(), async (req, res) => {
    try {
        const resultGroups = await getResultGroupById(req.params.id);
        if (!resultGroups) {
            req.session.failMessage = "Result group not found.";
            return res.redirect('/result/groups/dashboard');
        }
        const { categories, calcTemplates, timetableParts, timetablePartsRound1, timetablePartsRound2 } = await getGroupFormData(res.locals.selectedEvent?._id);
      
        res.render("resultGroup/editResultGroup", {
            categories: categories,
            formData: resultGroups,
            resultCalcs: calcTemplates,
            timetableParts: timetableParts,
            timetablePartsRound1: timetablePartsRound1,
            timetablePartsRound2: timetablePartsRound2,
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
});

resultRouter.post("/groups/edit/:id", Verify, VerifyRole(), async (req, res) => {
    try {
        const resultGroupDoc = await updateResultGroup(req.params.id, req.body);
        logger.db(`Result group ${resultGroupDoc?._id || req.params.id} edited by user ${req.user.username}.`);
        req.session.successMessage = "Result group edited successfully.";
        res.redirect("/result/groups/dashboard");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        const { categories, calcTemplates, timetableParts, timetablePartsRound1, timetablePartsRound2 } = await getGroupFormData(res.locals.selectedEvent?._id);
        return res.render("resultGroup/editResultGroup", {
            categories: categories,
            formData: { ...req.body, _id: req.params.id },
            resultCalcs: calcTemplates,
            timetableParts: timetableParts,
            timetablePartsRound1: timetablePartsRound1,
            timetablePartsRound2: timetablePartsRound2,
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
});

resultRouter.get("/groups/new", Verify, VerifyRole(), async (req, res) => {
    try {
        const { categories, calcTemplates, timetableParts, timetablePartsRound1, timetablePartsRound2 } = await getGroupFormData(res.locals.selectedEvent?._id);
        res.render("resultGroup/newResultGroup", {
            categories: categories,
            formData: req.session.formData || {},
            resultCalcs: calcTemplates,
            timetableParts: timetableParts,
            timetablePartsRound1: timetablePartsRound1,
            timetablePartsRound2: timetablePartsRound2,
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
});

resultRouter.post("/groups/new", Verify, VerifyRole(), async (req, res) => {
    try {
        const newResultGroup = await createResultGroup(res.locals.selectedEvent?._id, req.body);
        logger.db(`Result group ${newResultGroup._id} created by user ${req.user.username}.`);
        req.session.successMessage = "Result group created successfully.";
        res.redirect("/result/groups/dashboard");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        const { categories, calcTemplates, timetableParts, timetablePartsRound1, timetablePartsRound2 } = await getGroupFormData(res.locals.selectedEvent?._id);
        return res.render("resultGroup/newResultGroup", {
            categories: categories,
            formData: req.body,
            resultCalcs: calcTemplates,
            timetableParts: timetableParts,
            timetablePartsRound1: timetablePartsRound1,
            timetablePartsRound2: timetablePartsRound2,
            rolePermissons: req.user?.role?.permissions,
            failMessage: errorMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
    }
});

resultRouter.delete("/groups/delete/:id", Verify, VerifyRole(), async (req, res) => {
    try {
        const resultGroupDoc = await deleteResultGroup(req.params.id);
        logger.db(`Result group ${resultGroupDoc?._id || req.params.id} deleted by user ${req.user.username}.`);
        req.session.successMessage = "Result group deleted successfully.";
        res.status(200).send("Result group deleted successfully.");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        req.session.failMessage = errorMessage;
        return res.redirect('/result/groups/dashboard');
    }
});

resultRouter.post("/groups/generate", Verify, VerifyRole(), async (req, res) => {
    try {
        await generateGroupsForActiveGenerators(res.locals.selectedEvent?._id, req.user.username);
        req.session.successMessage = "Result groups generated successfully.";
        res.status(200).send("Result groups generated successfully.");
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err?.message || (err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error');
        req.session.failMessage = errorMessage;
        return res.redirect('/result/groups/dashboard');
    }
});

resultRouter.get("/", Verify, VerifyRole(), async (req, res) => {
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
});

resultRouter.get("/detailed/:id/:part", Verify, VerifyRole(), async (req, res) => {
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
});


export default resultRouter;


