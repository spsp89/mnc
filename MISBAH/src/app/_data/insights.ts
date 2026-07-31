export const insights = {
  "brand-building-digital-age": {
    title: "Brand Building in the Digital Age",
    summary:
      "How to stay distinctive when every category begins to look and sound the same.",
    readTime: "5 min read",
    sections: [
      {
        heading: "Digital visibility is not the same as distinction",
        paragraphs: [
          "Digital channels have made it easier for brands to publish, advertise and imitate category conventions. The result is often more activity but less meaningful difference.",
          "A distinctive brand begins with a strategic choice: the specific audience it will serve, the value it will be known for and the perspective it can credibly own.",
        ],
      },
      {
        heading: "Build from a position, not a content calendar",
        paragraphs: [
          "Content becomes more effective when every message reinforces the same market position. Without that foundation, teams produce disconnected campaigns that may attract attention without building memory.",
          "Define the few ideas the brand must repeatedly own. Then use formats, channels and campaigns to express those ideas in ways appropriate to the audience.",
        ],
      },
      {
        heading: "Consistency should create recognition",
        paragraphs: [
          "Consistency is not repeating the same execution forever. It is making every new execution recognisably yours through a stable promise, point of view, verbal character and visual system.",
          "The goal is cumulative impact: each interaction should make the next interaction easier to recognise, understand and trust.",
        ],
      },
    ],
    takeaways: [
      "Define the position before increasing content output.",
      "Choose a small set of ideas the brand can credibly own.",
      "Measure recognition and preference, not visibility alone.",
    ],
  },
  "strategic-branding-business-growth": {
    title: "Strategic Branding for Business Growth",
    summary:
      "Where brand strategy creates commercial leverage—and where it does not.",
    readTime: "6 min read",
    sections: [
      {
        heading: "Brand strategy is a business decision",
        paragraphs: [
          "Brand strategy creates value when it clarifies who the business is for, why it should be chosen and how it will compete. These choices influence products, experience, communication and commercial priorities.",
          "A new identity cannot compensate for an unclear offer or an undifferentiated customer experience. Growth begins with the business decisions beneath the expression.",
        ],
      },
      {
        heading: "Focus creates leverage",
        paragraphs: [
          "Strong positioning helps teams decide what to emphasise, what to stop and where to invest. It gives sales, marketing, product and leadership a shared basis for decision-making.",
          "That alignment reduces fragmented execution and helps the organisation build one coherent reputation in the market.",
        ],
      },
      {
        heading: "Connect brand measures to business behaviour",
        paragraphs: [
          "Useful brand measurement connects awareness and perception with behaviours such as consideration, conversion, retention and advocacy.",
          "Choose a small set of measures linked to the commercial challenge. Track them consistently enough to distinguish long-term movement from short-term campaign noise.",
        ],
      },
    ],
    takeaways: [
      "Treat positioning as a commercial choice.",
      "Use the brand platform to align cross-functional decisions.",
      "Connect brand indicators with customer behaviour.",
    ],
  },
  "leadership-alignment-before-rebranding": {
    title: "Leadership Alignment Before Rebranding",
    summary:
      "Why internal decision clarity must come before visual identity work.",
    readTime: "5 min read",
    sections: [
      {
        heading: "Misalignment appears as a creative problem",
        paragraphs: [
          "Rebranding projects often slow down when leaders hold different assumptions about the organisation’s audience, ambition or competitive position. Design reviews then become a substitute for unresolved strategic debate.",
          "The solution is not more creative options. It is an explicit leadership conversation about the choices the brand must represent.",
        ],
      },
      {
        heading: "Agree on the decision criteria",
        paragraphs: [
          "Before evaluating names, messages or identity directions, leaders should agree on the business objective, priority audience, desired market position and non-negotiable principles.",
          "These criteria turn subjective reactions into a more useful assessment of whether an option supports the strategy.",
        ],
      },
      {
        heading: "Alignment must continue into activation",
        paragraphs: [
          "A leadership decision only creates value when teams understand how it changes their work. Translate the strategy into practical implications for customer experience, communication, culture and measurement.",
          "Visible leadership sponsorship gives teams confidence to apply the new direction consistently rather than retreating to familiar habits.",
        ],
      },
    ],
    takeaways: [
      "Resolve strategic disagreement before creative development.",
      "Use agreed criteria to evaluate every brand decision.",
      "Translate leadership alignment into team-level action.",
    ],
  },
} as const;

export type InsightSlug = keyof typeof insights;
