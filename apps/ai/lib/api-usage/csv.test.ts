import { describe, it, expect } from "vitest";
import { streamCsvResponse } from "./csv";

async function readAllText(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
  }
  return text;
}

describe("streamCsvResponse", () => {
  it("writes the header row followed by each page's rows, in order", async () => {
    const pages = [["a", "b"], ["c"], []];
    const res = streamCsvResponse(
      "test.csv",
      ["Col1", "Col2"],
      async (page) => pages[page] as unknown as string[][],
      (row) => [row as unknown as string, "x"]
    );
    const text = await readAllText(res);
    expect(text).toBe("Col1,Col2\r\na,x\r\nb,x\r\nc,x\r\n");
  });

  it("quotes and escapes fields containing commas, quotes, or newlines", async () => {
    const res = streamCsvResponse(
      "test.csv",
      ["Name"],
      async (page) => (page === 0 ? ['Acme, Inc.', 'Say "hi"', "Line\nBreak"] : []),
      (row) => [row as unknown as string]
    );
    const text = await readAllText(res);
    const lines = text.trim().split("\r\n");
    expect(lines).toEqual([
      "Name",
      '"Acme, Inc."',
      '"Say ""hi"""',
      '"Line\nBreak"',
    ]);
  });

  it("stops as soon as a page comes back empty, never calling fetchPage again", async () => {
    let calls = 0;
    const res = streamCsvResponse(
      "test.csv",
      ["Col"],
      async (page) => {
        calls += 1;
        return page < 2 ? ["row"] : [];
      },
      (row) => [row as unknown as string]
    );
    await readAllText(res);
    expect(calls).toBe(3); // pages 0, 1 (data), then 2 (empty, stops)
  });

  it("sets CSV content-type and attachment disposition headers", () => {
    const res = streamCsvResponse("my-export.csv", ["Col"], async () => [], (r) => [r as unknown as string]);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    expect(res.headers.get("Content-Disposition")).toContain('filename="my-export.csv"');
  });
});
