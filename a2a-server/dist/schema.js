"use strict";
/**
 * A2A Server Schema Types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodeUnsupportedOperation = exports.ErrorCodePushNotificationNotSupported = exports.ErrorCodeTaskNotCancelable = exports.ErrorCodeTaskNotFound = exports.ErrorCodeInternalError = exports.ErrorCodeInvalidParams = exports.ErrorCodeMethodNotFound = exports.ErrorCodeInvalidRequest = exports.ErrorCodeParseError = void 0;
// JSON-RPC Error codes according to the spec
exports.ErrorCodeParseError = -32700;
exports.ErrorCodeInvalidRequest = -32600;
exports.ErrorCodeMethodNotFound = -32601;
exports.ErrorCodeInvalidParams = -32602;
exports.ErrorCodeInternalError = -32603;
exports.ErrorCodeTaskNotFound = -32000;
exports.ErrorCodeTaskNotCancelable = -32001;
exports.ErrorCodePushNotificationNotSupported = -32002;
exports.ErrorCodeUnsupportedOperation = -32003;
