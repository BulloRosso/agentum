import * as schema from "./schema.js";

/**
 * Custom error class for A2A server operations, incorporating JSON-RPC error codes.
 */
export class A2AError extends Error {
  /**
   * @param {number} code - Error code
   * @param {string} message - Error message
   * @param {*} [data] - Optional error data
   * @param {string} [taskId] - Optional task ID for context
   */
  constructor(code, message, data, taskId) {
    super(message);
    this.name = "A2AError";
    this.code = code;
    this.data = data;
    this.taskId = taskId; // Store associated task ID if provided
  }

  /**
   * Formats the error into a standard JSON-RPC error object structure.
   * @returns {import('./schema.js').JSONRPCError}
   */
  toJSONRPCError() {
    const errorObject = {
      code: this.code,
      message: this.message,
    };
    if (this.data !== undefined) {
      errorObject.data = this.data;
    }
    return errorObject;
  }

  // Static factory methods for common errors

  /**
   * @param {string} message - Error message
   * @param {*} [data] - Optional error data
   * @returns {A2AError}
   */
  static parseError(message, data) {
    return new A2AError(schema.ErrorCodeParseError, message, data);
  }

  /**
   * @param {string} message - Error message
   * @param {*} [data] - Optional error data
   * @returns {A2AError}
   */
  static invalidRequest(message, data) {
    return new A2AError(schema.ErrorCodeInvalidRequest, message, data);
  }

  /**
   * @param {string} method - The method that wasn't found
   * @returns {A2AError}
   */
  static methodNotFound(method) {
    return new A2AError(
      schema.ErrorCodeMethodNotFound,
      `Method not found: ${method}`
    );
  }

  /**
   * @param {string} message - Error message
   * @param {*} [data] - Optional error data
   * @returns {A2AError}
   */
  static invalidParams(message, data) {
    return new A2AError(schema.ErrorCodeInvalidParams, message, data);
  }

  /**
   * @param {string} message - Error message
   * @param {*} [data] - Optional error data
   * @returns {A2AError}
   */
  static internalError(message, data) {
    return new A2AError(schema.ErrorCodeInternalError, message, data);
  }

  /**
   * @param {string} taskId - The task ID that wasn't found
   * @returns {A2AError}
   */
  static taskNotFound(taskId) {
    return new A2AError(
      schema.ErrorCodeTaskNotFound,
      `Task not found: ${taskId}`,
      undefined,
      taskId
    );
  }

  /**
   * @param {string} taskId - The task ID that can't be canceled
   * @returns {A2AError}
   */
  static taskNotCancelable(taskId) {
    return new A2AError(
      schema.ErrorCodeTaskNotCancelable,
      `Task not cancelable: ${taskId}`,
      undefined,
      taskId
    );
  }

  /**
   * @returns {A2AError}
   */
  static pushNotificationNotSupported() {
    return new A2AError(
      schema.ErrorCodePushNotificationNotSupported,
      "Push Notification is not supported"
    );
  }

  /**
   * @param {string} operation - The unsupported operation
   * @returns {A2AError}
   */
  static unsupportedOperation(operation) {
    return new A2AError(
      schema.ErrorCodeUnsupportedOperation,
      `Unsupported operation: ${operation}`
    );
  }
}