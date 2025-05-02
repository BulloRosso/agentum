/**
 * Main entry point for the A2A Server library.
 * Exports the server class, store implementations, and core types.
 */

// Export the main server class and its options
export { A2AServer } from "./server.js";
export type { A2AServerOptions } from "./server.js";

// Export handler-related types
export type { TaskHandler, TaskContext, TaskYieldUpdate } from "./handler.js";

// Export store-related types and implementations
export type { TaskStore, TaskAndHistory } from "./store.js";
export { InMemoryTaskStore, FileStore } from "./store.js";

// Export the custom error class
export { A2AError } from "./error.js";

// Re-export all schema types for convenience
export * as schema from "./schema.js";