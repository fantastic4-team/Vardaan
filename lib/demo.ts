import type { CallLog, Memory, MessageLog, Reminder, Task, User } from "@/lib/db";

// A read-only demo account, so anyone can explore the dashboard without signing up. Its data is
// added in memory on every read and never saved (see lib/db.ts), timed relative to now so it
// always looks recent. middleware.ts blocks every change made while signed in as the demo.
export const DEMO_USER_ID = "demo";
export const DEMO_EMAIL = "demo@vardaan.app";
const PHONE = "+919800000000";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const ahead = (minutes: number) => new Date(Date.now() + minutes * 60_000).toISOString();

function nextSunday7pm() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  d.setHours(19, 0, 0, 0);
  return d.toISOString();
}

export function demoData() {
  const user: User = {
    id: DEMO_USER_ID,
    name: "Aarav Sharma",
    email: DEMO_EMAIL,
    passwordHash: "", // Never matches a password: the demo is entered only through /demo.
    phone: PHONE,
    lang: "en-IN",
    createdAt: ago(60 * 24 * 6),
  };
  const u = { userId: DEMO_USER_ID };

  const tasks: Task[] = [
    {
      ...u,
      id: "demo-task-landlord",
      request: "Email my landlord the kitchen tap is leaking and ask when it can be fixed",
      status: "needs_approval",
      steps: ["Find the landlord's email", "Draft the message", "Wait for approval"],
      answers: [{ question: "What is your landlord's email address?", answer: "mr.sen@example.com" }],
      drafts: [
        {
          id: "demo-draft-landlord",
          channel: "email",
          to: "mr.sen@example.com",
          subject: "Leaking kitchen tap at flat 3B",
          body: "Hello Mr Sen,\n\nThe kitchen tap in flat 3B has been leaking since Monday and the drip is getting worse. Could you let me know when someone can come to fix it? I'm home after 6 pm on weekdays and any time on Saturday.\n\nThank you,\nAarav",
          status: "draft",
        },
      ],
      summary: "Drafted the email to Mr Sen. Approve it to send.",
      createdAt: ago(130),
      updatedAt: ago(118),
    },
    {
      ...u,
      id: "demo-task-phones",
      request: "Compare the best phones under ₹15,000 for my mother: big screen, loud speaker, simple to use",
      status: "done",
      steps: ["Search current phones under ₹15,000", "Shortlist for screen, speaker and ease of use", "Call back with the results"],
      answers: [],
      drafts: [],
      summary:
        "Shortlisted three phones with large screens and loud speakers. The best fit is the one with the simplest launcher mode and the longest battery. I called you with the details.",
      createdAt: ago(60 * 26),
      updatedAt: ago(60 * 25),
    },
    {
      ...u,
      id: "demo-task-gas",
      request: "Book a gas cylinder refill for Maa's house in Kolkata",
      status: "needs_input",
      steps: ["Get the gas agency and consumer number", "Prepare the booking message", "Confirm with you"],
      question: "Which gas agency is Maa with, and what is her consumer number?",
      answers: [],
      drafts: [],
      createdAt: ago(40),
      updatedAt: ago(38),
    },
    {
      ...u,
      id: "demo-task-doctor",
      request: "Message Dr Banerjee's clinic to move Papa's appointment to Friday morning",
      status: "done",
      steps: ["Draft the message to the clinic", "Wait for approval", "Send"],
      answers: [],
      drafts: [
        {
          id: "demo-draft-doctor",
          channel: "sms",
          to: "+919800000001",
          body: "Hello, this is Aarav, son of Subhash Sharma. Could we move his appointment with Dr Banerjee to Friday morning? Thank you.",
          status: "approved",
        },
      ],
      summary: "Approved and handed to your messages app to send.",
      createdAt: ago(60 * 50),
      updatedAt: ago(60 * 49),
    },
  ];

  const calls: CallLog[] = [
    {
      ...u,
      id: "demo-call-1",
      direction: "outbound",
      reason: "Call me",
      phone: PHONE,
      status: "completed",
      turns: [
        { role: "assistant", content: "Hi Aarav, this is Vardaan, your AI assistant. What can I help you with today?", at: ago(130) },
        { role: "user", content: "Remind me to call Maa every Sunday at 7 pm.", at: ago(130) },
        { role: "assistant", content: "Done. I'll ring you every Sunday at 7 pm to call Maa.", at: ago(129) },
        { role: "user", content: "And email my landlord that the kitchen tap is leaking.", at: ago(129) },
        { role: "assistant", content: "On it. You can hang up, I'll text you the draft to approve.", at: ago(129) },
      ],
      silences: 0,
      taskIds: ["demo-task-landlord"],
      startedAt: ago(131),
      answeredAt: ago(130),
      endedAt: ago(128),
      durationSec: 108,
    },
    {
      ...u,
      id: "demo-call-2",
      direction: "outbound",
      reason: "Task result: Compare the best phones under ₹15,000 for my mother",
      phone: PHONE,
      status: "completed",
      turns: [
        { role: "assistant", content: "Hi Aarav, this is Vardaan. I'm calling about the phones for your mother. Is this a good time?", at: ago(60 * 25) },
        { role: "user", content: "Yes, go ahead.", at: ago(60 * 25) },
        { role: "assistant", content: "I found three good options under fifteen thousand. The best fit has a big screen, a loud speaker and a simple mode with large icons.", at: ago(60 * 25) },
        { role: "user", content: "Which one has the longest battery?", at: ago(60 * 25) },
        { role: "assistant", content: "The same one. It lasts about two days. I've put all three in your dashboard so you can compare.", at: ago(60 * 25) },
      ],
      silences: 0,
      taskIds: ["demo-task-phones"],
      startedAt: ago(60 * 25 + 4),
      answeredAt: ago(60 * 25 + 3),
      endedAt: ago(60 * 25),
      durationSec: 185,
    },
    {
      ...u,
      id: "demo-call-3",
      direction: "inbound",
      reason: "You called Vardaan",
      phone: PHONE,
      status: "completed",
      turns: [
        { role: "assistant", content: "Hi Aarav, Vardaan here. What can I do for you?", at: ago(60 * 30) },
        { role: "user", content: "My electricity bill doubled this month. Can you explain why?", at: ago(60 * 30) },
        { role: "assistant", content: "Let's go through it together. Read me the units used this month and last month.", at: ago(60 * 30) },
        { role: "user", content: "Four hundred and ten this month, one eighty last month.", at: ago(60 * 30) },
        { role: "assistant", content: "That's more than double the units, so the bill follows. The jump usually comes from the AC or a geyser. Your rate also moves to a higher slab above three hundred units.", at: ago(60 * 30) },
      ],
      silences: 0,
      taskIds: [],
      startedAt: ago(60 * 30 + 3),
      answeredAt: ago(60 * 30 + 3),
      endedAt: ago(60 * 30),
      durationSec: 151,
    },
    {
      ...u,
      id: "demo-call-4",
      direction: "outbound",
      reason: "Reminder: Pay the electricity bill",
      phone: PHONE,
      status: "completed",
      turns: [
        { role: "assistant", content: "Hi Aarav, this is Vardaan. I'm calling about your reminder: Pay the electricity bill. Would you like me to do anything about it?", at: ago(60 * 22) },
        { role: "user", content: "No, I'll pay it now. Thanks.", at: ago(60 * 22) },
        { role: "assistant", content: "Okay. I'll message you with any updates. Goodbye!", at: ago(60 * 22) },
      ],
      silences: 0,
      taskIds: [],
      startedAt: ago(60 * 22 + 1),
      answeredAt: ago(60 * 22 + 1),
      endedAt: ago(60 * 22),
      durationSec: 52,
    },
  ];

  const messages: MessageLog[] = [
    { ...u, id: "demo-msg-1", direction: "outbound", status: "sent", body: "Vardaan: What is your landlord's email address?\nReply to this message with your answer.", createdAt: ago(126) },
    { ...u, id: "demo-msg-2", direction: "inbound", status: "received", body: "mr.sen@example.com", createdAt: ago(122) },
    {
      ...u,
      id: "demo-msg-3",
      direction: "outbound",
      status: "sent",
      body: "Vardaan: Drafted the email to Mr Sen. Approve it to send.\nReply YES to approve and send, or open your dashboard to edit it first.",
      createdAt: ago(118),
    },
    {
      ...u,
      id: "demo-msg-4",
      direction: "outbound",
      status: "sent",
      body: "Vardaan: Which gas agency is Maa with, and what is her consumer number?\nReply to this message with your answer.",
      createdAt: ago(38),
    },
  ];

  const memories: Memory[] = [
    { ...u, id: "demo-mem-1", fact: "Lives in Bangalore. Parents live in Kolkata.", createdAt: ago(60 * 24 * 5) },
    { ...u, id: "demo-mem-2", fact: "Landlord is Mr Sen, mr.sen@example.com", createdAt: ago(122) },
    { ...u, id: "demo-mem-3", fact: "Papa sees Dr Banerjee for his blood pressure.", createdAt: ago(60 * 50) },
    { ...u, id: "demo-mem-4", fact: "Prefers short calls and updates by text.", createdAt: ago(60 * 24 * 4) },
  ];

  const reminders: Reminder[] = [
    { ...u, id: "demo-rem-1", title: "Call Maa", dueAt: nextSunday7pm(), createdAt: ago(129) },
    { ...u, id: "demo-rem-2", title: "Papa's appointment with Dr Banerjee", dueAt: ahead(60 * 24 * 2 + 90), createdAt: ago(60 * 49) },
    { ...u, id: "demo-rem-3", title: "Pay the electricity bill", dueAt: ago(60 * 22 + 2), calledAt: ago(60 * 22 + 1), createdAt: ago(60 * 24 * 3) },
  ];

  return { user, tasks, calls, messages, memories, reminders };
}
