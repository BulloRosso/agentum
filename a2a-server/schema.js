/**
 * This file contains TypeScript schema definitions for the A2A (Agent-to-Agent) protocol.
 * Since we're using JavaScript, these are provided as JSDoc comments for documentation purposes.
 */

// JSON-RPC error codes
export const ErrorCodeParseError = -32700;
export const ErrorCodeInvalidRequest = -32600;
export const ErrorCodeMethodNotFound = -32601;
export const ErrorCodeInvalidParams = -32602;
export const ErrorCodeInternalError = -32603;

// Custom A2A error codes
export const ErrorCodeTaskNotFound = -32000;
export const ErrorCodeTaskNotCancelable = -32001;
export const ErrorCodePushNotificationNotSupported = -32002;
export const ErrorCodeUnsupportedOperation = -32003;

/**
 * @typedef {Object} Task
 * @property {string} id - Unique identifier for the task
 * @property {string} [sessionId] - Optional session identifier 
 * @property {Object} [metadata] - Optional metadata about the task
 * @property {TaskStatus} status - Current status of the task
 * @property {Array<Artifact>} [artifacts] - Optional artifacts produced by the task
 */

/**
 * @typedef {Object} TaskStatus
 * @property {TaskState} state - The current state of the task
 * @property {string} timestamp - ISO 8601 timestamp when this status was set
 * @property {Message} [message] - Optional message associated with this status
 */

/**
 * @typedef {('working'|'completed'|'failed'|'canceled'|'input-required')} TaskState
 */

/**
 * @typedef {Object} Message
 * @property {string} role - Role of the message sender (e.g., "user", "agent")
 * @property {Array<MessagePart>} parts - Content parts of the message
 */

/**
 * @typedef {Object} MessagePart
 * @property {string} [text] - Optional text content
 * @property {Blob} [blob] - Optional binary content
 */

/**
 * @typedef {Object} Artifact
 * @property {string} [name] - Optional name of the artifact
 * @property {string} [mimeType] - Optional MIME type of the artifact
 * @property {string} [description] - Optional description of the artifact
 * @property {Array<MessagePart>} parts - Content parts of the artifact
 * @property {Object} [metadata] - Optional metadata about the artifact
 * @property {number} [index] - Optional index for ordering artifacts
 * @property {boolean} [append] - Whether to append to an existing artifact
 * @property {boolean} [lastChunk] - Whether this is the last chunk of a streaming artifact
 */

/**
 * @typedef {Object} AgentCard
 * @property {string} name - Name of the agent
 * @property {string} [description] - Optional description of the agent
 * @property {Array<string>} [tags] - Optional tags describing the agent
 * @property {Object} [platformSettings] - Optional platform-specific settings
 */

/**
 * @typedef {Object} JSONRPCRequest
 * @property {string|number} id - Identifier for the request
 * @property {string} jsonrpc - JSON-RPC version (always "2.0")
 * @property {string} method - Method name to invoke
 * @property {Object} params - Method parameters
 */

/**
 * @typedef {Object} JSONRPCResponse
 * @property {string|number|null} id - Identifier matching the request id, or null for notifications
 * @property {string} jsonrpc - JSON-RPC version (always "2.0")
 * @property {*} [result] - Result of the method call (if successful)
 * @property {JSONRPCError} [error] - Error object (if method call failed)
 */

/**
 * @typedef {Object} JSONRPCError
 * @property {number} code - Error code
 * @property {string} message - Error message
 * @property {*} [data] - Additional error data
 */

/**
 * @typedef {number} KnownErrorCode
 */

/**
 * @typedef {Object} SendTaskParams
 * @property {string} id - Task ID
 * @property {Message} message - User message to process
 * @property {string} [sessionId] - Optional session ID
 * @property {Object} [metadata] - Optional task metadata
 */

/**
 * @typedef {Object} SendTaskRequest
 * @property {string|number} id - Request ID
 * @property {string} jsonrpc - Always "2.0"
 * @property {string} method - Always "tasks/send"
 * @property {SendTaskParams} params - Task parameters
 */

/**
 * @typedef {Object} SendTaskStreamingRequest
 * @property {string|number} id - Request ID
 * @property {string} jsonrpc - Always "2.0"
 * @property {string} method - Always "tasks/sendSubscribe"
 * @property {SendTaskParams} params - Task parameters
 */

/**
 * @typedef {Object} GetTaskParams
 * @property {string} id - Task ID to retrieve
 * @property {boolean} [includeHistory] - Optional flag to include message history
 */

/**
 * @typedef {Object} GetTaskRequest
 * @property {string|number} id - Request ID
 * @property {string} jsonrpc - Always "2.0"
 * @property {string} method - Always "tasks/get"
 * @property {GetTaskParams} params - Task parameters
 */

/**
 * @typedef {Object} CancelTaskParams
 * @property {string} id - Task ID to cancel
 */

/**
 * @typedef {Object} CancelTaskRequest
 * @property {string|number} id - Request ID
 * @property {string} jsonrpc - Always "2.0"
 * @property {string} method - Always "tasks/cancel"
 * @property {CancelTaskParams} params - Task parameters
 */

/**
 * @typedef {Object} TaskStatusUpdateEvent
 * @property {string} type - Always "status"
 * @property {string} id - Task ID this event pertains to
 * @property {TaskStatus} status - Updated task status
 * @property {boolean} final - Whether this is the final event
 */

/**
 * @typedef {Object} TaskArtifactUpdateEvent
 * @property {string} type - Always "artifact"
 * @property {string} id - Task ID this event pertains to
 * @property {Artifact} artifact - Updated or new artifact
 * @property {boolean} final - Whether this is the final event
 */