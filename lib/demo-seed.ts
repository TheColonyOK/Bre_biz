import type { DemoState } from "./demo-types";

/** A fresh, explicitly fictional workspace for a newly authenticated demo user. */
export function createDemoSeed(now = new Date()): DemoState {
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const date = (offset: number) => {
    const future = new Date(today);
    future.setUTCDate(future.getUTCDate() + offset);
    return future.toISOString().slice(0, 10);
  };

  return {
    inquiries: [
      {
        id: "inquiry-demo-wedding",
        name: "Demo inquiry · Avery Morgan",
        email: "avery@example.test",
        phone: "(555) 010-0142",
        type: "Wedding reception",
        service: "Planning + bar",
        date: date(35),
        time: "16:00",
        guests: 86,
        location: "The Garden Room (sample venue)",
        budget: "$6,000–$8,000",
        notes: "Fictional demo request. Interested in a relaxed garden-party feel and a short signature-drink menu.",
        status: "confirmed",
        createdAt: new Date(today.getTime() - 3 * 86400000).toISOString(),
        eventId: "event-demo-wedding",
      },
      {
        id: "inquiry-demo-birthday",
        name: "Demo inquiry · Jordan Lee",
        email: "jordan@example.test",
        phone: "(555) 010-0196",
        type: "Milestone birthday",
        service: "Mobile bartending",
        date: date(22),
        time: "18:30",
        guests: 42,
        location: "Private residence (sample venue)",
        budget: "$1,200–$1,800",
        notes: "Fictional sample. Host asked about two zero-proof choices and a simple hosted bar.",
        status: "contacted",
        createdAt: new Date(today.getTime() - 86400000).toISOString(),
        eventId: null,
      },
      {
        id: "inquiry-demo-company",
        name: "Demo inquiry · Casey Rivera",
        email: "casey@example.test",
        phone: "(555) 010-0128",
        type: "Company celebration",
        service: "Event planning",
        date: date(48),
        time: "17:00",
        guests: 120,
        location: "Foundry Hall, Sample city",
        budget: "$8,000–$10,000",
        notes: "Fictional sample request for a year-end team gathering. No booking has been made.",
        status: "new",
        createdAt: today.toISOString(),
        eventId: null,
      },
    ],
    events: [
      {
        id: "event-demo-wedding",
        title: "Demo wedding reception · Avery & Morgan",
        date: date(35),
        venue: "The Garden Room (sample venue)",
        guests: 86,
        notes: "Fictional planning example. Confirm vendor arrival windows with the venue before sharing a final schedule.",
        drinks: ["Rosemary citrus spritz", "Classic old fashioned", "Cucumber mint cooler"],
        tasks: [
          { id: "task-w-1", title: "Confirm venue access and load-in window", done: true },
          { id: "task-w-2", title: "Review final guest count with hosts", done: false },
          { id: "task-w-3", title: "Print drink menu and allergy notes", done: false },
          { id: "task-w-4", title: "Pack bar tools and glassware checklist", done: false },
        ],
        timeline: [
          { id: "time-w-1", time: "14:30", title: "Planning team arrival" },
          { id: "time-w-2", time: "15:30", title: "Bar setup and venue walkthrough" },
          { id: "time-w-3", time: "16:00", title: "Guest arrival and welcome drinks" },
          { id: "time-w-4", time: "18:00", title: "Dinner service begins" },
        ],
        budgetItems: [
          { id: "budget-w-1", name: "Bar service and staffing", estimated: 1450, actual: 0 },
          { id: "budget-w-2", name: "Mixers, garnishes, and ice", estimated: 380, actual: 0 },
          { id: "budget-w-3", name: "Rentals and printed menus", estimated: 260, actual: 0 },
        ],
      },
      {
        id: "event-demo-open-house",
        title: "Demo studio open house",
        date: date(15),
        venue: "The Studio, Sample city",
        guests: 55,
        notes: "Fictional event-planning example for testing the event dashboard.",
        drinks: ["Peach iced tea", "Sparkling berry lemonade", "Citrus rosemary soda"],
        tasks: [
          { id: "task-o-1", title: "Send arrival details to vendors", done: true },
          { id: "task-o-2", title: "Test sound and welcome signage", done: false },
          { id: "task-o-3", title: "Prepare non-alcoholic drink station", done: false },
        ],
        timeline: [
          { id: "time-o-1", time: "10:00", title: "Vendor load-in" },
          { id: "time-o-2", time: "11:30", title: "Final walkthrough" },
          { id: "time-o-3", time: "12:00", title: "Doors open" },
        ],
        budgetItems: [
          { id: "budget-o-1", name: "Non-alcoholic refreshments", estimated: 240, actual: 0 },
          { id: "budget-o-2", name: "Florals and welcome table", estimated: 320, actual: 0 },
        ],
      },
    ],
    posts: [
      {
        id: "post-demo-hosting-timeline",
        title: "A Calm, Clear Timeline for Your Celebration",
        category: "Planning tips",
        excerpt: "A practical way to shape the day so hosts can enjoy it, vendors know where to be, and guests never feel rushed.",
        body: `A thoughtful event timeline is less about scheduling every minute and more about giving the important moments enough room. Start with the fixed points: venue access, ceremony or program start, meal service, and any hard venue curfew. Then work backward from each one.

Build in setup time that reflects the real room. A decorated space, a working bar, and a sound check all need different kinds of access. Ask vendors what they need before assigning arrival windows, and confirm whether deliveries can happen together. A short shared load-in plan can prevent several cars and teams from arriving at the same narrow entrance at once.

Protect a small buffer before guests arrive. Use it for a final walkthrough, water and a snack for the team, and quick fixes that always seem to appear. Keep guest-facing transitions simple: a welcome drink can help bridge arrival and dinner, while a clear announcement can bring people back together after mingling.

Write the schedule in plain language. Include the time, the action, and the person responsible. “5:30 — doors open; welcome table staffed by Alex” is more useful than a list of times alone. Share the version vendors need, and keep a host copy with contact details and the venue address.

Finally, identify which moments can move. Photos, speeches, and dessert may have some flexibility; a venue closing time usually does not. When the plan has room to breathe, a late toast or a longer conversation feels like part of the celebration rather than a problem to solve. Treat this timeline as a planning example and confirm details with your own venue and vendors.`,
        image: "/images/details.webp",
        published: true,
        readTime: "3 min read",
      },
      {
        id: "post-demo-bar-menu",
        title: "Designing a Bar Menu Guests Can Navigate",
        category: "Bar planning",
        excerpt: "A focused drink list can feel generous while keeping service smooth and choices easy to understand.",
        body: `A good event bar menu helps guests choose quickly and helps the service team prepare consistently. Begin with the shape of the gathering: a short reception may need fast, easy-to-carry drinks, while a seated dinner gives guests more time to explore. The venue, season, guest count, and available equipment all affect what will work.

Offer a small set of distinct choices instead of a long list of similar drinks. One bright and citrusy option, one richer classic, and one alcohol-free drink give guests different paths without creating a complicated station. Give each option a clear name and a short description of its main flavors. If a drink contains a common allergen or an ingredient guests may not recognize, name it plainly.

Plan the service details with the menu. Drinks that share ingredients are easier to batch and restock. Consider what can be prepared ahead, what needs to be finished to order, and how ice, glassware, and garnishes will be replenished. Keep water visible and easy to reach. For a larger gathering, a separate self-serve water point can reduce pressure at the bar.

Ask the host about preferences and constraints early, including whether the event should be alcohol-free. A welcoming menu does not assume every guest drinks alcohol. A thoughtful zero-proof choice can feel just as special when it has balanced flavor, an appealing garnish, and a proper glass.

Before printing, test the menu at the venue or with the person providing service. Confirm ingredients, quantities, and any licensing or venue requirements with the responsible professionals. The best menu is one guests understand at a glance and the team can serve with care.`,
        image: "/images/cocktails.webp",
        published: true,
        readTime: "3 min read",
      },
      {
        id: "post-demo-weather-plan",
        title: "Make an Outdoor Event Weather-Ready",
        category: "Planning tips",
        excerpt: "A practical backup plan keeps an outdoor celebration comfortable when the forecast changes.",
        body: `Outdoor events have a special atmosphere, but comfort depends on decisions made before the day. Begin with the venue’s actual backup options. Ask what indoor space is available, how many guests it accommodates, when a weather decision must be made, and who has authority to make the call. A vague promise to “move inside if needed” is difficult to act on without those details.

Create a simple decision point based on the conditions that matter for your event. Rain is only one factor: strong wind can affect signage and décor, heat can change food and drink needs, and a cold evening may require extra layers or a shorter program outdoors. Use reliable local forecasts as the date approaches, and agree with the venue on who will monitor them.

Think through the guest journey in both versions of the plan. Where will people enter? Will there be a covered place to wait? How will guests find the ceremony, bar, restrooms, or accessible route if the layout changes? Put the same information in the hands of the host, venue contact, and key vendors so nobody is improvising from an old floor plan.

Pack for small discomforts too. Water, shade, a few umbrellas, towel cloths, and a place to store wet items can make a difference. Keep electrical equipment protected and follow the venue’s safety instructions. Do not place tents, heaters, or generators without confirming that they are approved and safely installed.

The goal is not to control the weather; it is to make a clear choice early enough that everyone can adapt. Share the backup plan in a calm, direct message, then let the hosts focus on welcoming their guests. This is general planning guidance; follow the venue’s rules and your vendors’ safety advice.`,
        image: "/images/celebration.webp",
        published: true,
        readTime: "3 min read",
      },
    ],
    highlights: [
      {
        id: "highlight-demo-wedding",
        title: "Demo garden wedding",
        category: "Weddings",
        description: "A fictional sample setup with a garden-inspired drink menu and a relaxed reception timeline.",
        image: "/images/celebration.webp",
        guests: 86,
      },
      {
        id: "highlight-demo-private",
        title: "Demo milestone gathering",
        category: "Private parties",
        description: "A fictional private-party concept with bright seasonal drinks and a welcoming zero-proof choice.",
        image: "/images/cocktails.webp",
        guests: 42,
      },
      {
        id: "highlight-demo-corporate",
        title: "Demo team open house",
        category: "Corporate",
        description: "A fictional company-event example focused on easy arrival, clear signage, and simple service flow.",
        image: "/images/details.webp",
        guests: 55,
      },
    ],
  };
}

// Kept exported alongside the seed builder for clients that need a synchronous fallback.
export const demoSeed = createDemoSeed;

