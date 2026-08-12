// apps/ai/lib/email/graph.ts
// Microsoft Graph email service.
// Uses client-credentials flow (app-only) with Mail.Send application permission.
// Sends as any of the shared mailboxes: info@, sales@, hr@.

// apps/ai/lib/email/graph.ts
// Microsoft Graph email service.
// Uses client-credentials flow (app-only) with Mail.Send application permission.
// Sends as any of the shared mailboxes: info@, sales@, hr@.

import "server-only";

type GraphTokenCache = {
  token: string;
  expiresAt: number; // epoch ms
};

let tokenCache: GraphTokenCache | null = null;

// Exported so a health check can confirm Graph auth actually works
// (token exchange succeeds) without sending a real email to do it.
export async function getGraphToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  const tenant = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenant || !clientId || !clientSecret) {
    throw new Error("Missing AZURE_TENANT_ID, AZURE_CLIENT_ID, or AZURE_CLIENT_SECRET");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  const res = await fetch(
    "https://login.microsoftonline.com/" + tenant + "/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Failed to get Graph token: " + res.status + " " + text);
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

export type SendMailOptions = {
  from: string; // shared mailbox address (must be sales@/info@/hr@)
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
};

/**
 * Send an email via Microsoft Graph on behalf of a shared mailbox.
 * Throws on failure — caller should catch and log to email_events.
 */
export async function sendGraphMail(opts: SendMailOptions): Promise<void> {
  const token = await getGraphToken();
  const toList = Array.isArray(opts.to) ? opts.to : [opts.to];
  const ccList = opts.cc ? (Array.isArray(opts.cc) ? opts.cc : [opts.cc]) : [];
  const bccList = opts.bcc ? (Array.isArray(opts.bcc) ? opts.bcc : [opts.bcc]) : [];

  const message: Record<string, unknown> = {
    subject: opts.subject,
    body: { contentType: "HTML", content: opts.html },
    toRecipients: toList.map((email) => ({ emailAddress: { address: email } })),
  };

  if (ccList.length) {
    message.ccRecipients = ccList.map((e) => ({ emailAddress: { address: e } }));
  }
  if (bccList.length) {
    message.bccRecipients = bccList.map((e) => ({ emailAddress: { address: e } }));
  }
  if (opts.replyTo) {
    message.replyTo = [{ emailAddress: { address: opts.replyTo } }];
  }

  const res = await fetch(
    "https://graph.microsoft.com/v1.0/users/" +
      encodeURIComponent(opts.from) +
      "/sendMail",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        saveToSentItems: true,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      "Graph sendMail failed for " + opts.from + ": " + res.status + " " + text
    );
  }
}
