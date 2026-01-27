import Event from '../models/Event.js';
import Permissions from '../models/Permissions.js';
import User from '../models/User.js';

/**
 * Get all events sorted by name
 */
export async function getAllEvents() {
    return await Event.find().sort({ name: 1 });
}

/**
 * Get event by ID
 */
export async function getEventById(id) {
    const event = await Event.findById(id);
    if (!event) {
        throw new Error('Event not found');
    }
    return event;
}

/**
 * Create a new event
 */
export async function createEvent(data) {
    const newEvent = new Event(data);
    await newEvent.save();
    return newEvent;
}

/**
 * Update event by ID
 */
export async function updateEvent(id, data) {
    const event = await Event.findByIdAndUpdate(id, data, { runValidators: true });
    if (!event) {
        throw new Error('Event not found');
    }
    return event;
}

/**
 * Delete a responsible person from event's AssignedOfficials
 */
export async function deleteResponsiblePerson(id, personData) {
    const event = await Event.findById(id);
    if (!event) {
        throw new Error('Event not found');
    }
    
    event.AssignedOfficials = event.AssignedOfficials.filter(official =>
        !(
            official.name === personData.name &&
            official.role === personData.role &&
            official.contact === personData.contact
        )
    );
    
    await Event.findByIdAndUpdate(id, event, { runValidators: true });
    return event;
}

/**
 * Add a responsible person to event's AssignedOfficials
 */
export async function addResponsiblePerson(id, personData) {
    const event = await Event.findById(id);
    if (!event) {
        throw new Error('Event not found');
    }
    
    const newResponsiblePerson = {
        name: personData.name,
        role: personData.role,
        contact: personData.contact,
        userID: personData.userID
    };
    
    event.AssignedOfficials.push(newResponsiblePerson);
    await Event.findByIdAndUpdate(id, event, { runValidators: true });
    return event;
}

/**
 * Set an event as selected (uses static method)
 */
export async function selectEvent(eventId) {
    const event = await Event.findById(eventId);
    if (!event) {
        throw new Error('Event not found');
    }
    
    await Event.setSelected(eventId);
    return event;
}

/**
 * Get all permissions for form data
 */
export async function getAllPermissions() {
    return await Permissions.find();
}

/**
 * Get all users with limited fields for selection
 */
export async function getAllUsers() {
    return await User.find().select('_id username');
}
