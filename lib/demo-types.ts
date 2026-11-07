export type InquiryStatus = "new" | "contacted" | "confirmed" | "declined";
export type EventTask = { id: string; title: string; done: boolean };
export type EventTimelineItem = { id: string; time: string; title: string };
export type EventBudgetItem = {
  id: string;
  name: string;
  estimated: number;
  actual: number;
};

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  service: "Event planning" | "Mobile bartending" | "Planning + bar";
  date: string;
  time: string;
  guests: number;
  location: string;
  budget: string;
  notes: string;
  status: InquiryStatus;
  createdAt: string;
  eventId: string | null;
};

export type Event = {
  id: string;
  title: string;
  date: string;
  venue: string;
  guests: number;
  notes: string;
  drinks: string[];
  tasks: EventTask[];
  timeline: EventTimelineItem[];
  budgetItems: EventBudgetItem[];
};

export type Post = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  image: string;
  published: boolean;
  readTime: string;
};

export type Highlight = {
  id: string;
  title: string;
  category: "Weddings" | "Private parties" | "Corporate";
  description: string;
  image: string;
  guests: number;
};

export type DemoState = {
  inquiries: Inquiry[];
  events: Event[];
  posts: Post[];
  highlights: Highlight[];
};

export type DemoActionRequest = {
  action: string;
  payload: unknown;
  version: number;
};

export type DemoStateResponse = { state: DemoState; version: number };
