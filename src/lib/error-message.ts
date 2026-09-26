import { ConvexError } from "convex/values";

export function getErrorMessage(error: unknown, fallback: string = "حدث خطأ غير متوقع"): string {
  if (!error) return fallback;

  // 1. Direct ConvexError instance from Convex SDK
  if (error instanceof ConvexError) {
    if (typeof error.data === "string" && error.data.trim()) {
      return error.data.trim();
    }
    if (
      typeof error.data === "object" &&
      error.data !== null &&
      "message" in error.data &&
      typeof (error.data as { message: unknown }).message === "string"
    ) {
      return (error.data as { message: string }).message.trim();
    }
  }

  // 2. Regular Error or serialized ConvexError
  if (error instanceof Error) {
    const rawMessage = error.message.trim();

    // Check for "Uncaught ConvexError: <message>"
    const convexMatch = rawMessage.match(/Uncaught ConvexError:\s*(.+)/);
    if (convexMatch && convexMatch[1]) {
      return convexMatch[1].trim();
    }

    // Filter out internal server error traces or Convex request ID strings
    if (
      rawMessage.includes("Server Error") ||
      rawMessage.includes("Called by client") ||
      rawMessage.includes("[CONVEX") ||
      rawMessage.includes("Request ID:")
    ) {
      return fallback;
    }

    return rawMessage;
  }

  if (typeof error === "string" && error.trim()) {
    if (
      error.includes("Server Error") ||
      error.includes("Called by client") ||
      error.includes("[CONVEX")
    ) {
      return fallback;
    }
    return error.trim();
  }

  return fallback;
}

