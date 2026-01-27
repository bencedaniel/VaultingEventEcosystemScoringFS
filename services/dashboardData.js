import DashCards from '../models/DashCards.js';

/**
 * Get all dashboard cards by type, sorted by priority
 */
export const getDashCardsByType = async (dashtype) => {
    return await DashCards.find({ dashtype }).sort({ priority: 1 });
};

/**
 * Get dashboard card by ID
 */
export const getDashCardById = async (id) => {
    const card = await DashCards.findById(id);
    if (!card) {
        throw new Error('Dashboard card not found');
    }
    return card;
};

/**
 * Create new dashboard card
 */
export const createDashCard = async (data) => {
    const newCard = new DashCards(data);
    await newCard.save();
    return newCard;
};

/**
 * Update dashboard card by ID
 */
export const updateDashCard = async (id, data) => {
    const card = await DashCards.findByIdAndUpdate(id, data, { runValidators: true });
    if (!card) {
        throw new Error('Dashboard card not found');
    }
    return card;
};

/**
 * Delete dashboard card by ID
 */
export const deleteDashCard = async (id) => {
    const card = await DashCards.findByIdAndDelete(id);
    if (!card) {
        throw new Error('Dashboard card not found');
    }
    return card;
};
