import { parseSrt, parseSrtTimestamp } from "../src/srt";

describe("parseSrt", () => {
  it("parses normalized lyric cues", () => {
    const cues = parseSrt(`1
00:00:00,000 --> 00:00:01,250
First line

2
00:00:02,000 --> 00:00:03,500
Second line
Second row`);

    expect(cues).toEqual([
      {
        index: 1,
        startMs: 0,
        endMs: 1250,
        text: "First line",
        lines: ["First line"]
      },
      {
        index: 2,
        startMs: 2000,
        endMs: 3500,
        text: "Second line\nSecond row",
        lines: ["Second line", "Second row"]
      }
    ]);
  });

  it("rejects invalid cue timing", () => {
    expect(() =>
      parseSrt(`1
bad timing
Nope`)
    ).toThrow(/Invalid cue timing line/);
  });

  it("parses SRT timestamps", () => {
    expect(parseSrtTimestamp("01:02:03,456")).toBe(3723456);
  });
});
