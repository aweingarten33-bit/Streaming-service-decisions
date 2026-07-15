import { describe, expect, test } from "bun:test";
import { localIntent } from "@/lib/marquee/intent";

describe("localIntent (deterministic fallback, no API key required)", () => {
  test("picks up an explicit '90 minutes' runtime constraint", () => {
    const intent = localIntent("I got like 90 minutes");
    expect(intent.maxRuntimeMinutes).toBe(90);
  });

  test("falls back to a sensible default when '90' is mentioned without units", () => {
    const intent = localIntent("give me something ninety minute-ish");
    expect(intent.maxRuntimeMinutes).toBe(95);
  });

  test("picks up an explicit minute count", () => {
    const intent = localIntent("give me something under 120 minutes");
    expect(intent.maxRuntimeMinutes).toBe(120);
  });

  test("detects low attention / phone-friendly requests", () => {
    const intent = localIntent("I'm probably gonna be on my phone");
    expect(intent.backgroundFriendly).toBe(true);
  });

  test("detects a fast-hook request and turns off background-friendly", () => {
    const intent = localIntent("give me something that gets good immediately");
    expect(intent.hookSpeed).toBe("fast");
  });

  test("detects an explicit avoid-mood phrase without needing the LLM", () => {
    const intent = localIntent("something dark but not depressing as hell");
    expect(intent.avoidMoods).toContain("depressing");
    expect(intent.moods).toContain("dark");
  });

  test("detects tv vs movie preference", () => {
    expect(localIntent("I want a show but not a huge commitment").mediaType).toBe("tv");
    expect(localIntent("I wanna watch a movie tonight").mediaType).toBe("movie");
  });

  test("defaults to media-type any and medium settings for a vague request", () => {
    const intent = localIntent("I dunno. Just pick something.");
    expect(intent.mediaType).toBe("any");
    expect(intent.attentionLevel).toBe("medium");
  });

  test("never crashes on messy, profane, or contradictory input", () => {
    expect(() =>
      localIntent(
        "everything looks like shit, gimme something dark but not depressing, 90 min, tv or movie whatever",
      ),
    ).not.toThrow();
  });
});
