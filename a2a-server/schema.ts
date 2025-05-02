/**
 * A2A Server Schema Types
 */

// JSON-RPC Error codes according to the spec
export const ErrorCodeParseError = -32700;
export const ErrorCodeInvalidRequest = -32600;
export const ErrorCodeMethodNotFound = -32601;
export const ErrorCodeInvalidParams = -32602;
export const ErrorCodeInternalError = -32603;
export const ErrorCodeTaskNotFound = -32000;
export const ErrorCodeTaskNotCancelable = -32001;
export const ErrorCodePushNotificationNotSupported = -32002;
export const ErrorCodeUnsupportedOperation = -32003;

// Union of all known error codes
export type KnownErrorCode =
  | typeof ErrorCodeParseError
  | typeof ErrorCodeInvalidRequest
  | typeof ErrorCodeMethodNotFound
  | typeof ErrorCodeInvalidParams
  | typeof ErrorCodeInternalError
  | typeof ErrorCodeTaskNotFound
  | typeof ErrorCodeTaskNotCancelable
  | typeof ErrorCodePushNotificationNotSupported
  | typeof ErrorCodeUnsupportedOperation;

// JSON-RPC Error object
export interface JSONRPCError<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

// JSON-RPC Request base
export interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, any> | any[];
}

// JSON-RPC Response (success or error)
export interface JSONRPCResponse<T = any, E = unknown> {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: T;
  error?: JSONRPCError<E>;
}

// Message part (text, image, etc.)
export interface Part {
  text?: string;
  // Potentially other part types in the future
}

// User or Agent message
export interface Message {
  role: "user" | "agent";
  parts: Part[];
}

// Task status states
export type TaskState =
  | "submitted"
  | "working"
  | "completed"
  | "failed"
  | "canceled"
  | "input-required";

// Status of a task
export interface TaskStatus {
  state: TaskState;
  timestamp: string;
  message: Message | null;
}

// Artifact (output of a task)
export interface Artifact {
  name?: string;
  mimeType?: string;
  index?: number;
  parts: Part[];
  description?: string;
  lastChunk?: boolean;
  metadata?: Record<string, any>;
  append?: boolean;
}

// Task object
export interface Task {
  id: string;
  sessionId?: string;
  status: TaskStatus;
  artifacts?: Artifact[];
  metadata?: Record<string, any>;
}

// Agent card
export interface AgentCard {
  name: string;
  description: string;
  instructions?: string;
  suggestedMessages?: string[];
  capabilities?: string[];
  version?: string;
}

// Task event interfaces
export interface TaskStatusUpdateEvent {
  id: string;
  status: TaskStatus;
  final: boolean;
}

export interface TaskArtifactUpdateEvent {
  id: string;
  artifact: Artifact;
  final: boolean;
}

// Task request parameters
export interface TaskSendParams {
  id: string;
  message: Message;
  sessionId?: string | null;
  metadata?: Record<string, any> | null;
}

// Request interfaces
export interface SendTaskRequest extends JSONRPCRequest {
  method: "tasks/send";
  params: TaskSendParams;
}

export interface SendTaskStreamingRequest extends JSONRPCRequest {
  method: "tasks/sendSubscribe";
  params: TaskSendParams;
}

export interface GetTaskRequest extends JSONRPCRequest {
  method: "tasks/get";
  params: {
    id: string;
  };
}

export interface CancelTaskRequest extends JSONRPCRequest {
  method: "tasks/cancel";
  params: {
    id: string;
  };
}