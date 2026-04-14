import { describe, it, expect } from "vitest";
import { createSeededRng, shuffleArray, computeEffectiveOrder } from "../src/components/slideshow/order";

describe("createSeededRng", () => {
  it("produces deterministic output for the same seed", () => {
    const rng1 = createSeededRng(42);
    const rng2 = createSeededRng(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it("produces different output for different seeds", () => {
    const rng1 = createSeededRng(1);
    const rng2 = createSeededRng(2);
    const seq1 = Array.from({ length: 5 }, () => rng1());
    const seq2 = Array.from({ length: 5 }, () => rng2());
    expect(seq1).not.toEqual(seq2);
  });

  it("produces values in [0, 1)", () => {
    const rng = createSeededRng(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("shuffleArray", () => {
  it("returns a new array with the same elements", () => {
    const rng = createSeededRng(42);
    const input = [0, 1, 2, 3, 4];
    const result = shuffleArray(input, rng);
    expect(result).toHaveLength(5);
    expect(result.sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it("does not mutate the original array", () => {
    const rng = createSeededRng(42);
    const input = [0, 1, 2, 3, 4];
    const copy = [...input];
    shuffleArray(input, rng);
    expect(input).toEqual(copy);
  });

  it("produces deterministic output for the same seed", () => {
    const result1 = shuffleArray([0, 1, 2, 3, 4], createSeededRng(99));
    const result2 = shuffleArray([0, 1, 2, 3, 4], createSeededRng(99));
    expect(result1).toEqual(result2);
  });
});

describe("computeEffectiveOrder", () => {
  it("returns identity for sequential order", () => {
    expect(computeEffectiveOrder(5, "sequential", 0)).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns identity for random order (per-slot handled by caller)", () => {
    expect(computeEffectiveOrder(5, "random", 42)).toEqual([0, 1, 2, 3, 4]);
  });

  it("returns shuffled array for shuffle order", () => {
    const result = computeEffectiveOrder(5, "shuffle", 42);
    expect(result).toHaveLength(5);
    expect(result.sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it("handles single image", () => {
    expect(computeEffectiveOrder(1, "shuffle", 42)).toEqual([0]);
  });
});
