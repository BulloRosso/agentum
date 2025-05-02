/**
 * A2A Schema - Core types for the A2A protocol
 * Simplified version for frontend client usage
 */

// JSON-RPC Core Types
export interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params: any;
}

export interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

// A2A Type Definitions
export type A2ARequest = SendTaskRequest | GetTaskRequest | CancelTaskRequest |
  SendTaskStreamingRequest | TaskResubscriptionRequest |
  SetTaskPushNotificationRequest | GetTaskPushNotificationRequest;

// Message Types
export type MessagePartType = "text" | "image" | "video" | "audio" | "file";

export interface MessageTextPart {
  type: "text";
  text: string;
}

export interface MessageFilePart {
  type: Exclude<MessagePartType, "text">;
  mimeType: string;
  fileData?: {
    data: string; // base64 encoded
    filename?: string;
  };
  fileUrl?: string;
}

export type MessagePart = MessageTextPart | MessageFilePart;

export interface Message {
  role: "user" | "agent";
  parts: MessagePart[];
}

// Agent Types
export interface AgentCapabilities {
  streaming?: boolean;
  pushNotifications?: boolean;
}

export interface AgentCard {
  name: string;
  description?: string;
  version?: string;
  capabilities?: string[];
  suggestedMessages?: string[];
}

// Task Types
export type TaskState = "working" | "succeeded" | "failed" | "canceled" | "input-required";

export interface TaskStatus {
  state: TaskState;
  timestamp: string;
  message?: Message;
  error?: {
    message: string;
    code?: string;
  };
  output?: {
    parts: MessagePart[];
  };
}

export interface Artifact {
  name?: string;
  mimeType: string;
  parts: MessagePart[];
  index?: number;
  description?: string;
  metadata?: Record<string, any>;
  lastChunk?: boolean;
  append?: boolean;
}

export interface Task {
  id: string;
  message: Message;
  sessionId?: string;
  metadata?: Record<string, any>;
  status: TaskStatus;
  artifacts?: Artifact[];
}

// Update Event Types
export interface TaskStatusUpdateEvent {
  taskId: string;
  status: TaskStatus;
  final?: boolean;
}

export interface TaskArtifactUpdateEvent {
  taskId: string;
  artifact: Artifact;
  final?: boolean;
}

// Request Parameter Types
export interface TaskSendParams {
  id: string;
  message: Message;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface TaskIdParams {
  id: string;
}

export interface TaskQueryParams extends TaskIdParams {
  includeHistory?: boolean;
}

export interface TaskPushNotificationConfig extends TaskIdParams {
  url: string;
  enabled: boolean;
  secret?: string;
  events?: Array<"status" | "artifact">;
}

// Request Types
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
  params: TaskQueryParams;
}

export interface CancelTaskRequest extends JSONRPCRequest {
  method: "tasks/cancel";
  params: TaskIdParams;
}

export interface SetTaskPushNotificationRequest extends JSONRPCRequest {
  method: "tasks/pushNotification/set";
  params: TaskPushNotificationConfig;
}

export interface GetTaskPushNotificationRequest extends JSONRPCRequest {
  method: "tasks/pushNotification/get";
  params: TaskIdParams;
}

export interface TaskResubscriptionRequest extends JSONRPCRequest {
  method: "tasks/resubscribe";
  params: TaskQueryParams;
}

// Response Types
export interface SendTaskResponse extends JSONRPCResponse {
  result: Task | null;
}

export interface GetTaskResponse extends JSONRPCResponse {
  result: Task | null;
}

export interface CancelTaskResponse extends JSONRPCResponse {
  result: Task | null;
}

export interface SendTaskStreamingResponse extends JSONRPCResponse {
  result: TaskStatusUpdateEvent | TaskArtifactUpdateEvent;
}

export interface SetTaskPushNotificationResponse extends JSONRPCResponse {
  result: TaskPushNotificationConfig | null;
}

export interface GetTaskPushNotificationResponse extends JSONRPCResponse {
  result: TaskPushNotificationConfig | null;
}