import Vaulter from '../models/Vaulter.js';
import Entries from '../models/Entries.js';
import { logger } from '../logger.js';

/**
 * Get all vaulters sorted by name
 */
export async function getAllVaulters() {
  return await Vaulter.find().sort({ name: 1 }).exec();
}

/**
 * Get vaulter by ID with incident relationships
 */
export async function getVaulterById(id) {
  return await Vaulter.findById(id).populate('VaulterIncident.eventID', 'EventName').exec();
}

/**
 * Get vaulter by ID (lean version for editing)
 */
export async function getVaulterByIdLean(id) {
  return await Vaulter.findById(id).lean().exec();
}

/**
 * Create new vaulter
 */
export async function createVaulter(vaulterData) {
  const newVaulter = new Vaulter(vaulterData);
  await newVaulter.save();
  logger.db(`Vaulter ${vaulterData.name} created.`);
  return newVaulter;
}

/**
 * Update vaulter by ID
 */
export async function updateVaulter(id, vaulterData) {
  const vaulter = await Vaulter.findByIdAndUpdate(id, vaulterData, { runValidators: true }).exec();
  logger.db(`Vaulter ${vaulter.name} updated.`);
  return vaulter;
}

/**
 * Update vaulter arm number for specific event
 */
export async function updateVaulterArmNumber(id, eventId, armNumber) {
  const vaulter = await Vaulter.findById(id).exec();
  if (!vaulter) {
    throw new Error('Vaulter not found');
  }

  let editedCount = 0;
  vaulter.ArmNr.forEach(element => {
    if (String(element.eventID) === String(eventId)) {
      element.armNumber = armNumber;
      editedCount++;
    }
  });

  if (editedCount === 0) {
    vaulter.ArmNr.push({
      eventID: eventId,
      armNumber: armNumber
    });
  }

  await vaulter.save();
  logger.db(`Vaulter ${vaulter.name} arm number updated.`);
  return vaulter;
}

/**
 * Add incident to vaulter
 */
export async function addIncidentToVaulter(id, incidentData) {
  const vaulter = await Vaulter.findById(id).exec();
  if (!vaulter) {
    throw new Error('Vaulter not found');
  }

  vaulter.VaulterIncident.push(incidentData);
  await Vaulter.findByIdAndUpdate(id, vaulter, { runValidators: true }).exec();
  logger.db(`Incident added to vaulter ${vaulter.name}.`);
  return vaulter;
}

/**
 * Remove incident from vaulter by matching criteria
 */
export async function removeIncidentFromVaulter(id, incidentCriteria) {
  const vaulter = await Vaulter.findById(id).exec();
  if (!vaulter) {
    throw new Error('Vaulter not found');
  }

  // Helper: parse many date formats to ms
  const parseDateToMs = (input) => {
    if (!input && input !== 0) return null;
    if (typeof input === 'number') return input;
    const d1 = new Date(input);
    if (!Number.isNaN(d1.getTime())) return d1.getTime();

    // try to extract components like "2025. 11. 05. 12:44:01" or "2025-11-05 12:44:01"
    const m = String(input).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}):(\d{2}):(\d{2})/);
    if (m) {
      const [ , y, mo, da, hh, mm, ss ] = m;
      const d2 = new Date(Number(y), Number(mo)-1, Number(da), Number(hh), Number(mm), Number(ss));
      if (!Number.isNaN(d2.getTime())) return d2.getTime();
    }

    // try shorter pattern without seconds
    const m2 = String(input).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2}):(\d{2})/);
    if (m2) {
      const [ , y, mo, da, hh, mm ] = m2;
      const d3 = new Date(Number(y), Number(mo)-1, Number(da), Number(hh), Number(mm));
      if (!Number.isNaN(d3.getTime())) return d3.getTime();
    }

    return null;
  };

  const reqDateMs = parseDateToMs(incidentCriteria.date);
  const DATE_TOLERANCE_MS = 20 * 1000; // 20s tolerance

  vaulter.VaulterIncident = vaulter.VaulterIncident.filter(incident => {
    const incDesc = String(incident.description || '');
    const incType = String(incident.incidentType || '');
    const incUser = String(incident.user || incident.User || '');
    const incDateMs = parseDateToMs(incident.date);

    const descMatch = incDesc === String(incidentCriteria.description || '');
    const typeMatch = incType === String(incidentCriteria.incidentType || incidentCriteria.type || '');
    const userMatch = incUser === String(incidentCriteria.userId);

    let dateMatch = false;
    if (reqDateMs === null) {
      dateMatch = true;
    } else if (incDateMs === null) {
      dateMatch = true;
    } else {
      dateMatch = Math.abs(incDateMs - reqDateMs) <= DATE_TOLERANCE_MS;
    }

    const matchesAll = descMatch && typeMatch && userMatch && dateMatch;
    return !matchesAll;
  });

  await Vaulter.findByIdAndUpdate(id, vaulter, { runValidators: true }).exec();
  logger.db(`Incident removed from vaulter.`);
  return vaulter;
}

/**
 * Get all entries with vaulter population
 */
export async function getAllEntriesWithVaulters() {
  return await Entries.find().populate('vaulter').exec();
}

/**
 * Get all permissions
 */
export async function getAllPermissions() {
  const Permissions = (await import('../models/Permissions.js')).default;
  return await Permissions.find();
}

/**
 * Get all users
 */
export async function getAllUsers() {
  const User = (await import('../models/User.js')).default;
  return await User.find();
}
