import { describe, expect, test } from "bun:test";
import { getCopy, getPrompt, PROMPT_BANK, HEADLINE, importSummary } from "@/lib/marquee/copy";

describe("Unfiltered vs Clean-ish copy", () => {
  test("headline is fixed regardless of language setting", () => {
    expect(HEADLINE).toBe("WTF are you in the mood for?");
  });

  test("unfiltered primary action includes the harder profanity", () => {
    expect(getCopy("unfiltered").primaryActionLabel).toBe("Put This Shit On");
  });

  test("clean-ish primary action drops it but keeps the phrase's meaning", () => {
    expect(getCopy("clean").primaryActionLabel).toBe("Put This On");
  });

  test("every prompt in the bank has both a language variant", () => {
    for (const option of PROMPT_BANK) {
      expect(option.unfiltered.length).toBeGreaterThan(0);
      expect(option.clean.length).toBeGreaterThan(0);
    }
  });

  test("~15 prompts in the bank", () => {
    expect(PROMPT_BANK.length).toBeGreaterThanOrEqual(14);
    expect(PROMPT_BANK.length).toBeLessThanOrEqual(16);
  });

  test("getPrompt selects the right language variant", () => {
    const option = { unfiltered: "fuck it", clean: "fine" };
    expect(getPrompt(option, "unfiltered")).toBe("fuck it");
    expect(getPrompt(option, "clean")).toBe("fine");
  });

  test("not every prompt is aggressively profane", () => {
    const profaneCount = PROMPT_BANK.filter((p) => /fuck|shit/i.test(p.unfiltered)).length;
    expect(profaneCount).toBeLessThan(PROMPT_BANK.length);
  });
});

describe("importSummary", () => {
  test("matches the exact format from the product spec", () => {
    expect(importSummary(214, 3, 2)).toBe(
      "Done. 214 titles imported. 3 duplicates ignored. 2 need your help.",
    );
  });

  test("omits zero-count clauses", () => {
    expect(importSummary(5, 0, 0)).toBe("Done. 5 titles imported.");
  });

  test("singular vs plural", () => {
    expect(importSummary(1, 1, 1)).toBe(
      "Done. 1 title imported. 1 duplicate ignored. 1 needs your help.",
    );
  });
});
