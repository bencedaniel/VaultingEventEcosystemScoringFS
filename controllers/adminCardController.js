import { logger } from '../logger.js';
import {
    getAllCards,
    getCardById,
    getCardFormData,
    createCard,
    updateCard,
    deleteCard
} from '../services/adminCardData.js';

/**
 * @route GET /admin/newCard
 * @desc Show new card form
 */
async function getNewCardForm(req, res) {
    try {
        const { permissionList } = await getCardFormData();
        const userrole = req.user?.role.permissions;
        res.render("admin/newCard", {
            permissionList: permissionList,
            rolePermissons: userrole,
            failMessage: req.session.failMessage,
            formData: req.session.formData,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.successMessage = null;
        req.session.formData = null;
        req.session.failMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Error loading card form';
        res.redirect('/admin/dashboard');
    }
}

/**
 * @route GET /admin/dashboard/cards
 * @desc Show cards dashboard
 */
async function getCardsDashboard(req, res) {
    try {
        const cards = await getAllCards();
        const rolePermissons = req.user.role.permissions;
        res.render("admin/carddash", {
            rolePermissons: rolePermissons,
            cards: cards,
            failMessage: req.session.failMessage,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        req.session.failMessage = 'Error loading cards';
        res.redirect('/admin/dashboard');
    }
}

/**
 * @route GET /admin/editCard/:id
 * @desc Show edit card form
 */
async function getEditCardForm(req, res) {
    try {
        const { permissionList } = await getCardFormData();
        const card = await getCardById(req.params.id);
        res.render('admin/editCard', {
            permissionList: permissionList,
            formData: card,
            failMessage: req.session.failMessage,
            rolePermissons: req.user.role.permissions,
            successMessage: req.session.successMessage,
            user: req.user
        });
        req.session.failMessage = null;
        req.session.successMessage = null;
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        res.status(500).send('Server Error');
    }
}

/**
 * @route POST /admin/newCard
 * @desc Create new card
 */
async function createNewCardHandler(req, res) {
    try {
        const newCard = await createCard(req.body);
        logger.db(`Card ${newCard.title} created by user ${req.user.username}.`);
        req.session.successMessage = 'Card added successfully!';
        res.redirect('/admin/dashboard/cards');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        const { permissionList } = await getCardFormData();
        return res.render('admin/newCard', {
            permissionList: permissionList,
            formData: req.body,
            successMessage: null,
            failMessage: errorMessage,
            rolePermissons: req.user.role.permissions,
            user: req.user
        });
    }
}

/**
 * @route POST /admin/editCard/:id
 * @desc Update card
 */
async function updateCardHandler(req, res) {
    try {
        await updateCard(req.params.id, req.body);
        logger.db(`Card ${req.body.title} updated by user ${req.user.username}.`);
        req.session.successMessage = 'Card modified successfully!';
        res.redirect('/admin/dashboard/cards');
    } catch (err) {
        logger.error(err + " User: " + req.user.username);
        const errorMessage = err.errors
            ? Object.values(err.errors).map(e => e.message).join(' ')
            : 'Server error';
        const { permissionList } = await getCardFormData();
        return res.render('admin/editCard', {
            permissionList: permissionList,
            formData: req.body,
            successMessage: null,
            failMessage: errorMessage,
            rolePermissons: req.user.role.permissions,
            user: req.user
        });
    }
}

/**
 * @route DELETE /admin/deleteCard/:cardId
 * @desc Delete card
 */
async function deleteCardHandler(req, res) {
    try {
        const cardId = req.params.cardId;
        await deleteCard(cardId);
        logger.db(`Card ${cardId} deleted by user ${req.user.username}.`);
        req.session.successMessage = 'Card successfully deleted.';
        res.status(200).send('Card deleted.');
    } catch (err) {
        logger.error("Err:" + err.toString());
        res.status(500).send('Server Error');
    }
}

export default {
    getNewCardForm,
    getCardsDashboard,
    getEditCardForm,
    createNewCardHandler,
    updateCardHandler,
    deleteCardHandler
};
