import fs from "fs/promises";
import path from "path";
import { A2AError } from "./error.js";
import { getCurrentTimestamp } from "./utils.js";

/**
 * @typedef {Object} TaskAndHistory
 * @property {import('./schema.js').Task} task - The task object
 * @property {Array<import('./schema.js').Message>} history - Message history for the task
 */

/**
 * Interface for task storage providers.
 * Stores and retrieves both the task and its full message history together.
 */
export class TaskStore {
  /**
   * Saves a task and its associated message history.
   * Overwrites existing data if the task ID exists.
   * @param {TaskAndHistory} data - An object containing the task and its history.
   * @returns {Promise<void>} A promise resolving when the save operation is complete.
   */
  async save(data) {
    throw new Error("Not implemented");
  }

  /**
   * Loads a task and its history by task ID.
   * @param {string} taskId - The ID of the task to load.
   * @returns {Promise<TaskAndHistory|null>} A promise resolving to an object containing the Task and its history, or null if not found.
   */
  async load(taskId) {
    throw new Error("Not implemented");
  }
}

/**
 * In-memory implementation of the TaskStore.
 */
export class InMemoryTaskStore extends TaskStore {
  constructor() {
    super();
    this.store = new Map();
  }

  /**
   * @param {string} taskId
   * @returns {Promise<TaskAndHistory|null>}
   */
  async load(taskId) {
    const entry = this.store.get(taskId);
    // Return copies to prevent external mutation
    return entry
      ? { task: { ...entry.task }, history: [...entry.history] }
      : null;
  }

  /**
   * @param {TaskAndHistory} data
   * @returns {Promise<void>}
   */
  async save(data) {
    // Store copies to prevent internal mutation if caller reuses objects
    this.store.set(data.task.id, {
      task: { ...data.task },
      history: [...data.history],
    });
  }
}

/**
 * File-based implementation of the TaskStore.
 */
export class FileStore extends TaskStore {
  /**
   * @param {Object} [options]
   * @param {string} [options.dir] - Directory to store task files
   */
  constructor(options = {}) {
    super();
    // Default directory relative to the current working directory
    this.baseDir = options.dir || ".a2a-tasks";
  }

  /**
   * @returns {Promise<void>}
   */
  async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      throw A2AError.internalError(
        `Failed to create directory ${this.baseDir}: ${error.message}`,
        error
      );
    }
  }

  /**
   * @param {string} taskId
   * @returns {string}
   */
  getTaskFilePath(taskId) {
    // Sanitize taskId to prevent directory traversal
    const safeTaskId = path.basename(taskId);
    return path.join(this.baseDir, `${safeTaskId}.json`);
  }

  /**
   * @param {string} taskId
   * @returns {string}
   */
  getHistoryFilePath(taskId) {
    // Sanitize taskId
    const safeTaskId = path.basename(taskId);
    if (safeTaskId !== taskId || taskId.includes("..")) {
      throw A2AError.invalidParams(`Invalid Task ID format: ${taskId}`);
    }
    return path.join(this.baseDir, `${safeTaskId}.history.json`);
  }

  /**
   * @param {*} content
   * @returns {boolean}
   */
  isHistoryFileContent(content) {
    return (
      typeof content === "object" &&
      content !== null &&
      Array.isArray(content.messageHistory) &&
      // Optional: Add deeper validation of message structure if needed
      content.messageHistory.every(
        (msg) => typeof msg === "object" && msg.role && msg.parts
      )
    );
  }

  /**
   * @template T
   * @param {string} filePath
   * @returns {Promise<T|null>}
   */
  async readJsonFile(filePath) {
    try {
      const data = await fs.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return null; // File not found is not an error for loading
      }
      throw A2AError.internalError(
        `Failed to read file ${filePath}: ${error.message}`,
        error
      );
    }
  }

  /**
   * @param {string} filePath
   * @param {*} data
   * @returns {Promise<void>}
   */
  async writeJsonFile(filePath, data) {
    try {
      await this.ensureDirectoryExists();
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
      throw A2AError.internalError(
        `Failed to write file ${filePath}: ${error.message}`,
        error
      );
    }
  }

  /**
   * @param {string} taskId
   * @returns {Promise<TaskAndHistory|null>}
   */
  async load(taskId) {
    const taskFilePath = this.getTaskFilePath(taskId);
    const historyFilePath = this.getHistoryFilePath(taskId);

    // Read task file first - if it doesn't exist, the task doesn't exist.
    const task = await this.readJsonFile(taskFilePath);
    if (!task) {
      return null; // Task not found
    }

    // Task exists, now try to read history. It might not exist yet.
    let history = [];
    try {
      const historyContent = await this.readJsonFile(historyFilePath);
      // Validate the structure slightly
      if (this.isHistoryFileContent(historyContent)) {
        history = historyContent.messageHistory;
      } else if (historyContent !== null) {
        // Log a warning if the history file exists but is malformed
        console.warn(
          `[FileStore] Malformed history file found for task ${taskId} at ${historyFilePath}. Ignoring content.`
        );
        // Attempt to delete or rename the malformed file? Or just proceed with empty history.
        // For now, proceed with empty. A 'save' will overwrite it correctly later.
      }
      // If historyContent is null (file not found), history remains []
    } catch (error) {
      // Log error reading history but proceed with empty history
      console.error(
        `[FileStore] Error reading history file for task ${taskId}:`,
        error
      );
      // Proceed with empty history
    }

    return { task, history };
  }

  /**
   * @param {TaskAndHistory} data
   * @returns {Promise<void>}
   */
  async save(data) {
    const { task, history } = data;
    const taskFilePath = this.getTaskFilePath(task.id);
    const historyFilePath = this.getHistoryFilePath(task.id);

    // Ensure directory exists (writeJsonFile does this, but good practice)
    await this.ensureDirectoryExists();

    // Write both files - potentially in parallel
    await Promise.all([
      this.writeJsonFile(taskFilePath, task),
      this.writeJsonFile(historyFilePath, { messageHistory: history }),
    ]);
  }
}