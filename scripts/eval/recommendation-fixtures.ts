import { descriptors } from "../../config/descriptors";

type Fixture = {
  prompt: string;
  expectedDescriptors: string[];
  note: string;
};

const fixtures: Fixture[] = [
  {
    prompt: "I feel like shit",
    expectedDescriptors: ["comfort_watch", "uplifting", "feel_good", "low_stress", "cathartic"],
    note: "A bad-day request needs comfort, low stress, or catharsis rather than generic popularity.",
  },
  {
    prompt: "I want something bizarre",
    expectedDescriptors: [
      "weird",
      "surreal",
      "bizarre",
      "cult_favorite",
      "experimental",
      "absurdist",
    ],
    note: "Bizarre is a taste/tone request, not just a horror or sci-fi genre request.",
  },
  {
    prompt: "I want a movie like After Hours",
    expectedDescriptors: ["chaotic", "funny_but_dark", "weird"],
    note: "Reference-title prompts should be enriched from stored evidence when that title exists.",
  },
  {
    prompt: "I liked The Lobster but want something warmer",
    expectedDescriptors: ["absurdist", "weird", "feel_good", "uplifting"],
    note: "Mixed requests need both similarity and contrast descriptors.",
  },
  {
    prompt: "Something funny but not stupid",
    expectedDescriptors: ["funny_but_dark", "rewatchable"],
    note: "Comedy intent should prefer curator evidence about tone over comedy genre labels alone.",
  },
  {
    prompt: "A comfort movie that is not too childish",
    expectedDescriptors: ["comfort_watch", "low_stress", "parents_safe"],
    note: "Comfort should not collapse into generic family/kids recommendations.",
  },
];

const knownDescriptors = new Set(descriptors);
let failures = 0;

for (const fixture of fixtures) {
  const missing = fixture.expectedDescriptors.filter(
    (descriptor) => !knownDescriptors.has(descriptor),
  );
  if (missing.length > 0) {
    failures += 1;
    console.error(`FAIL: ${fixture.prompt}`);
    console.error(`  Missing descriptors from taxonomy: ${missing.join(", ")}`);
  } else {
    console.log(`PASS: ${fixture.prompt}`);
    console.log(`  Covers: ${fixture.expectedDescriptors.join(", ")}`);
  }
  console.log(`  ${fixture.note}`);
}

if (failures > 0) process.exit(1);
