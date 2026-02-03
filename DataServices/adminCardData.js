import { logDb } from '../logger.js';
import DashCards from '../models/DashCards.js';
import Permissions from '../models/Permissions.js';

/**
 * Get all dashboard cards
 */
export async function getAllCards() {
    return await DashCards.find();
}

/**
 * Get card by ID
 */
export async function getCardById(cardId) {
    return await DashCards.findById(cardId);
}

/**
 * Get form data for card creation/editing
 */
export async function getCardFormData() {
    const permissionList = await Permissions.find();
    return { permissionList };
}

/**
 * Create a new dashboard card
 */
export async function createCard(cardData) {
    const newCard = new DashCards(cardData);
    await newCard.save();
    logDb('CREATE', 'DashCard', `${newCard._id}`);
    return newCard;
}

/**
 * Update dashboard card
 */
export async function updateCard(cardId, cardData) {
    const card = await DashCards.findByIdAndUpdate(cardId, cardData, { runValidators: true });
    logDb('UPDATE', 'DashCard', `${cardId}`);
    return card;
}

/**
 * Delete dashboard card
 */
export async function deleteCard(cardId) {
    const card = await DashCards.findByIdAndDelete(cardId);
    logDb('DELETE', 'DashCard', `${cardId}`);
    return card;
}
