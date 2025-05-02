import { TaskContext, TaskYieldUpdate } from "./handler.js";
import * as schema from "./schema.js";

/**
 * A simple demo task handler implementation that echoes the user's message.
 */
export async function* demoTaskHandler(
  context: TaskContext
): AsyncGenerator<TaskYieldUpdate, schema.Task | void, unknown> {
  console.log(`Handling task: ${context.task.id}`);
  
  // Yield initial working status with a message
  yield {
    state: "working",
    message: { 
      role: "agent", 
      parts: [{ text: "Processing your request..." }] 
    },
  };

  // Simulate a delay for demo purposes
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check for cancellation
  if (context.isCancelled()) {
    console.log(`Task ${context.task.id} was cancelled`);
    return;
  }

  // Get the text from the user's message
  const userText = context.userMessage.parts
    .map(part => part.text || "")
    .join(" ")
    .trim();

  // Create an artifact with the message
  yield {
    name: "echo.txt",
    mimeType: "text/plain",
    parts: [{ text: `You said: ${userText}` }],
  };

  // Yield final completed status with a response message
  yield {
    state: "completed",
    message: { 
      role: "agent", 
      parts: [{ text: `I received your message: "${userText}"` }] 
    },
  };
}