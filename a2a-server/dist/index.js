"use strict";
/**
 * Main entry point for the A2A Server library.
 * Exports the server class, store implementations, and core types.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.A2AError = exports.FileStore = exports.InMemoryTaskStore = exports.A2AServer = void 0;
// Export the main server class and its options
var server_js_1 = require("./server.js");
Object.defineProperty(exports, "A2AServer", { enumerable: true, get: function () { return server_js_1.A2AServer; } });
var store_js_1 = require("./store.js");
Object.defineProperty(exports, "InMemoryTaskStore", { enumerable: true, get: function () { return store_js_1.InMemoryTaskStore; } });
Object.defineProperty(exports, "FileStore", { enumerable: true, get: function () { return store_js_1.FileStore; } });
// Export the custom error class
var error_js_1 = require("./error.js");
Object.defineProperty(exports, "A2AError", { enumerable: true, get: function () { return error_js_1.A2AError; } });
// Re-export all schema types for convenience
exports.schema = __importStar(require("./schema.js"));
