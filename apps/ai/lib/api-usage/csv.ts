import "server-only";

// Server-side, streamed CSV — deliberately not lib/file-export.ts's
// downloadCsv() (a client-side Blob helper used elsewhere in the app),
// because this export can cover every organization's usage history and
// should never require buffering the full result set into the browser
// first. Same field-escaping rule as downloadCsv() (quote a field if it
// contains a comma/quote/newline, doubling any internal quotes).
function escapeCsvField(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsvLine(fields: (string | number)[]): string {
  return fields.map(escapeCsvField).join(",") + "\r\n";
}

/**
 * Builds a streamed CSV Response from an async row source, so the export
 * route never holds the entire result set in memory at once. `fetchPage`
 * is called with successive 0-based page indexes until it returns an empty
 * array, at `pageSize` rows per call — the same page size the caller used
 * to query the database, so this doesn't force a second, different
 * pagination scheme.
 */
export function streamCsvResponse<T>(
  filename: string,
  headers: string[],
  fetchPage: (page: number) => Promise<T[]>,
  rowToFields: (row: T) => (string | number)[]
): Response {
  const encoder = new TextEncoder();

  // start() runs once and writes the whole export before closing — each
  // fetchPage() DB round trip is the real rate limiter here, so there's no
  // need for a pull-based generator to throttle emission further.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(toCsvLine(headers)));
        let page = 0;
        while (true) {
          const rows = await fetchPage(page);
          if (rows.length === 0) break;
          for (const row of rows) {
            controller.enqueue(encoder.encode(toCsvLine(rowToFields(row))));
          }
          page += 1;
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
