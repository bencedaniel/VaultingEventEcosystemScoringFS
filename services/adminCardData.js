import { logger } from '../logger.js';
import DashCards from '../models/DashCards.js';
import Permissions from '../models/Permissions.js';

/**
 * Get all dashboard cards
 */
export async function getAllCards() {
    try {
        return await DashCards.find();
    } catch (err) {
        logger.error('Error fetching cards: ' + err);
        throw err;
    }
}

/**
 * Get card by ID
 */
export async function getCardById(cardId) {
    try {
        return await DashCards.findById(cardId);
    } catch (err) {
        logger.error('Error fetching card by ID: ' + err);
        throw err;
    }
}

/**
 * Get form data for card creation/editing
 */
export async function getCardFormData() {
    try {
        const permissionList = await Permissions.find();
        return { permissionList };
    } catch (err) {
        logger.error('Error fetching card form data: ' + err);
        throw err;
    }
}

/**
 * Create a new dashboard card
 */
export async function createCard(cardData) {
    try {
        const newCard = new DashCards(cardData);
        await newCard.save();
        return newCard;
    } catch (err) {
        logger.error('Error creating card: ' + err);
        throw err;
    }
}

/**
 * Update dashboard card
 */
export async function updateCard(cardId, cardData) {
    try {
        return await DashCards.findByIdAndUpdate(cardId, cardData, { runValidators: true });
    } catch (err) {
        logger.error('Error updating card: ' + err);
        throw err;
    }
}

/**
 * Delete dashboard card
 */
export async function deleteCard(cardId) {
    try {
        return await DashCards.findByIdAndDelete(cardId);
    } catch (err) {
        logger.error('Error deleting card: ' + err);
        throw err;
    }
}
