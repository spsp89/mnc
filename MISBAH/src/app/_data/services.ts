export const services = {
  "brand-strategy": {
    title: "Brand Strategy & Positioning",
    summary:
      "Define the market position, value proposition and strategic choices that make your brand easier to choose.",
    audience:
      "For founders and leadership teams launching, repositioning or preparing a business for its next stage of growth.",
    outcomes: [
      "Clear category and competitive position",
      "A differentiated value proposition",
      "Audience priorities and decision drivers",
      "A practical brand platform for teams and partners",
    ],
    process: ["Research and discovery", "Strategic diagnosis", "Positioning development", "Activation roadmap"],
  },
  "brand-advisory": {
    title: "Leadership Brand Advisory",
    summary:
      "Ongoing strategic counsel that connects leadership decisions, market perception and brand execution.",
    audience:
      "For founders, CEOs and senior teams who need an experienced strategic partner beyond a one-off project.",
    outcomes: [
      "Sharper leadership and brand alignment",
      "Confident decisions at critical growth moments",
      "Consistent direction across internal and external teams",
      "Independent counsel grounded in market realities",
    ],
    process: ["Leadership alignment", "Priority diagnosis", "Advisory sessions", "Decision and execution reviews"],
  },
  mentorship: {
    title: "Visionary Brand Mentorship",
    summary:
      "Focused one-to-one guidance for leaders building their strategic confidence and brand capability.",
    audience:
      "For entrepreneurs and brand leaders who want practical guidance while retaining ownership of decisions and execution.",
    outcomes: [
      "A clearer strategic point of view",
      "Better briefs and more confident decisions",
      "Stronger brand leadership capability",
      "Accountability through focused working sessions",
    ],
    process: ["Goal definition", "Capability assessment", "Mentoring sessions", "Progress reviews"],
  },
} as const;

export type ServiceSlug = keyof typeof services;
