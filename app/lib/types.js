/**
 * Core data shapes for JSDoc typing in JS files.
 */

/**
 * @typedef {Object} Surah
 * @property {number} number
 * @property {string} name
 * @property {string} englishName
 * @property {string} englishNameTranslation
 * @property {number} numberOfAyahs
 * @property {string} revelationType
 */

/**
 * @typedef {Object} AyahTranslation
 * @property {string} [text]
 */

/**
 * @typedef {Object} Ayah
 * @property {number} number
 * @property {string} [arabic]
 * @property {Object.<string, AyahTranslation>} [translations]
 */

/**
 * @typedef {string} Bookmark
 */

/**
 * @typedef {Object} ReadingPlan
 * @property {string} startDate
 * @property {number} perDay
 * @property {number} startSurah
 * @property {number} startAyah
 */

export {};
