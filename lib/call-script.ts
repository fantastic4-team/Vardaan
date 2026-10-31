import type { CallLog } from "@/lib/db";

/** What Vardaan says first on a call, based on why it's calling. Used for the Sarvam call greeting and transcript. */
export function openingLine(call: Pick<CallLog, "reason" | "direction">, name?: string) {
  const first = name?.split(" ")[0] || "there";
  if (call.direction === "inbound") return `Hi ${first}, this is Vardaan, your AI assistant. What can I help you with?`;
  if (call.reason.startsWith("Reminder:")) {
    return `Hi ${first}, this is Vardaan, your AI assistant. I'm calling about your reminder: ${call.reason.slice(9).trim()}. Would you like me to do anything about it?`;
  }
  if (call.reason.startsWith("Task result:")) {
    return `Hi ${first}, this is Vardaan, your AI assistant. I'm calling because you asked me to help with: ${call.reason.slice(12).trim()}. Is this a good time to go over the results?`;
  }
  if (call.reason === "Call me") return `Hi ${first}, this is Vardaan, your AI assistant. What can I help you with today?`;
  return `Hi ${first}, this is Vardaan, your AI assistant. I'm calling about: ${call.reason}. Is this a good time?`;
}
