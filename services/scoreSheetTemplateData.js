import ScoreSheetTemp from '../models/ScoreSheetTemp.js';
import Category from '../models/Category.js';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../logger.js';

const uploadsDir = path.join(process.cwd(), 'static', 'uploads');

/**
 * Convert static URL to absolute file path
 */
function toAbsoluteFromStaticUrl(urlPath) {
  if (!urlPath) return null;
  let p = urlPath;
  if (/^https?:\/\//i.test(urlPath)) {
    try { p = new URL(urlPath).pathname; } catch { return null; }
  }
  if (!p.startsWith('/static/uploads/')) return null;
  return path.resolve(process.cwd(), p.replace(/^\//, ''));
}

/**
 * Check if path is inside uploads directory
 */
function isInsideUploads(absPath) {
  if (!absPath) return false;
  const rel = path.relative(uploadsDir, absPath);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * Delete image file from disk
 */
export async function deleteImageFile(staticUrl) {
  const abs = toAbsoluteFromStaticUrl(staticUrl);
  if (!abs) { logger.warn(`Skip delete (not static uploads): ${staticUrl}`); return; }
  if (!isInsideUploads(abs)) { logger.warn(`Skip delete (outside uploads): ${abs}`); return; }
  try {
    await fs.unlink(abs);
    logger.db(`Deleted file: ${abs}`);
  } catch (e) {
    logger.warn(`Delete failed or file missing: ${abs} -> ${e.message}`);
  }
}

/**
 * Parse JSON array field from form
 */
export function parseJSONArrayField(value, fieldName) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error(`${fieldName} must be an array`);
    return parsed.map(field => ({
      ...field,
      position: {
        ...field.position,
        w: field.width
      }
    }));
  } catch (e) {
    throw new Error(`${fieldName} parse error: ${e.message}`);
  }
}

/**
 * Get all score sheet templates with categories
 */
export async function getAllScoreSheetTemplates() {
  return await ScoreSheetTemp.find().populate('CategoryId').exec();
}

/**
 * Get score sheet template by ID
 */
export async function getScoreSheetTemplateById(id) {
  return await ScoreSheetTemp.findById(id).populate('CategoryId').exec();
}

/**
 * Get all categories sorted by Star
 */
export async function getAllCategories() {
  return await Category.find().sort({ Star: 1 }).exec();
}

/**
 * Get categories by IDs
 */
export async function getCategoriesByIds(ids) {
  return await Category.find({ _id: { $in: ids } }).exec();
}

/**
 * Create new score sheet template
 */
export async function createScoreSheetTemplate(templateData) {
  const sheet = new ScoreSheetTemp(templateData);
  await sheet.save();
  logger.db(`ScoreSheetTemp ${sheet._id} created.`);
  return sheet;
}

/**
 * Update score sheet template
 */
export async function updateScoreSheetTemplate(id, templateData) {
  const sheet = await ScoreSheetTemp.findByIdAndUpdate(id, templateData, {
    runValidators: true,
    new: true
  }).exec();
  logger.db(`ScoreSheetTemp ${sheet._id} updated.`);
  return sheet;
}

/**
 * Delete score sheet template
 */
export async function deleteScoreSheetTemplate(id) {
  const sheet = await ScoreSheetTemp.findByIdAndDelete(id).exec();
  if (sheet && sheet.bgImage) {
    await deleteImageFile(sheet.bgImage);
  }
  logger.db(`ScoreSheetTemp ${id} deleted.`);
  return sheet;
}

/**
 * Validate categories have same Agegroup type
 */
export function validateCategoriesAgegroup(categories) {
  if (categories.length === 0) {
    throw new Error('Selected category does not exist');
  }

  const firstType = categories[0].Type;
  const hasMixedAgegroup = categories.some(c => c.Type !== firstType);

  if (hasMixedAgegroup) {
    const missmatched = categories.filter(c => c.Type !== firstType).map(c => c.CategoryDispName).join(', ');
    throw new Error(`Selected categories must be of the same Agegroup type. Mismatched: ${missmatched}`);
  }

  return true;
}
