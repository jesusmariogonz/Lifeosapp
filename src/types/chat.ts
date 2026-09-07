// V3: AI planning assistant — shape kept persistence-ready even though V1 only
// stores it in client-side state (no ChatMessage Prisma model yet).
export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO timestamp
};

export type DailyPlan = {
  priorities: string[];
  timeBlocks: { start: string; end: string; label: string }[];
  note: string;
};
