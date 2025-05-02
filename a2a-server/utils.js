/**
 * Generates a timestamp in ISO 8601 format.
 * @returns {string} The current timestamp as a string.
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Checks if a value is a plain object (excluding arrays and null).
 * @param {*} value The value to check.
 * @returns {boolean} True if the value is a plain object, false otherwise.
 */
export function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if an object is a TaskStatus update (lacks 'parts').
 * Used to differentiate yielded updates from the handler.
 * @param {*} update The object to check
 * @returns {boolean} True if the object is a TaskStatus update
 */
export function isTaskStatusUpdate(update) {
  // Check if it has 'state' and NOT 'parts' (which Artifacts have)
  return isObject(update) && "state" in update && !("parts" in update);
}

/**
 * Type guard to check if an object is an Artifact update (has 'parts').
 * Used to differentiate yielded updates from the handler.
 * @param {*} update The object to check
 * @returns {boolean} True if the object is an Artifact update
 */
export function isArtifactUpdate(update) {
  // Check if it has 'parts'
  return isObject(update) && "parts" in update;
}