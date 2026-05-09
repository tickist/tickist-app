interface SesSendInput {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string | null;
  region: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  html: string | null;
  text: string | null;
  dedupeKey: string;
  type: string;
  configurationSet?: string | null;
}

export interface SesSendResult {
  ok: boolean;
  messageId?: string;
  statusCode: number;
  errorCode?: string;
  errorMessage?: string;
  retryable: boolean;
  throttled: boolean;
}

const encoder = new TextEncoder();

const hex = (buffer: ArrayBuffer | Uint8Array): string => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return hex(digest);
};

const hmacSha256Raw = async (
  key: Uint8Array,
  value: string,
): Promise<Uint8Array> => {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(value),
  );
  return new Uint8Array(signature);
};

const classifySesError = (
  statusCode: number,
  errorCode?: string,
): { retryable: boolean; throttled: boolean } => {
  const normalized = (errorCode ?? "").toLowerCase();
  const throttled = normalized.includes("throttl") ||
    normalized.includes("toomanyrequests") ||
    normalized.includes("limitexceeded") ||
    statusCode === 429;

  if (throttled) {
    return { retryable: true, throttled: true };
  }

  if (statusCode >= 500) {
    return { retryable: true, throttled: false };
  }

  return { retryable: false, throttled: false };
};

export const sendWithSes = async (input: SesSendInput): Promise<SesSendResult> => {
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const service = "ses";
  const host = `email.${input.region}.amazonaws.com`;
  const endpoint = `https://${host}/v2/email/outbound-emails`;
  const canonicalUri = "/v2/email/outbound-emails";

  const bodyPayload: Record<string, unknown> = {
    FromEmailAddress: input.fromEmail,
    Destination: {
      ToAddresses: [input.toEmail],
    },
    Content: {
      Simple: {
        Subject: {
          Data: input.subject,
          Charset: "UTF-8",
        },
        Body: {
          ...(input.html
            ? {
              Html: {
                Data: input.html,
                Charset: "UTF-8",
              },
            }
            : {}),
          ...(input.text
            ? {
              Text: {
                Data: input.text,
                Charset: "UTF-8",
              },
            }
            : {}),
        },
      },
    },
    EmailTags: [
      { Name: "dedupe_key", Value: input.dedupeKey.slice(0, 256) },
      { Name: "type", Value: input.type.slice(0, 256) },
    ],
  };

  if (input.configurationSet) {
    bodyPayload.ConfigurationSetName = input.configurationSet;
  }

  const payload = JSON.stringify(bodyPayload);
  const payloadHash = await sha256Hex(payload);

  const canonicalHeadersLines = [
    `content-type:application/json`,
    `host:${host}`,
    `x-amz-date:${amzDate}`,
  ];
  const signedHeadersList = ["content-type", "host", "x-amz-date"];
  if (input.sessionToken) {
    canonicalHeadersLines.push(`x-amz-security-token:${input.sessionToken}`);
    signedHeadersList.push("x-amz-security-token");
  }

  const canonicalHeaders = `${canonicalHeadersLines.join("\n")}\n`;
  const signedHeaders = signedHeadersList.join(";");
  const canonicalRequest = [
    "POST",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${input.region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = await hmacSha256Raw(
    encoder.encode(`AWS4${input.secretAccessKey}`),
    dateStamp,
  );
  const kRegion = await hmacSha256Raw(kDate, input.region);
  const kService = await hmacSha256Raw(kRegion, service);
  const kSigning = await hmacSha256Raw(kService, "aws4_request");
  const signature = hex(await hmacSha256Raw(kSigning, stringToSign));

  const authorization = `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Amz-Date": amzDate,
    "Authorization": authorization,
  };
  if (input.sessionToken) {
    requestHeaders["X-Amz-Security-Token"] = input.sessionToken;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: requestHeaders,
      body: payload,
    });

    const responseText = await response.text();
    let parsed: Record<string, unknown> = {};
    if (responseText.length > 0) {
      try {
        parsed = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        parsed = {};
      }
    }

    if (response.ok) {
      const messageId = typeof parsed?.MessageId === "string"
        ? parsed.MessageId
        : undefined;
      return {
        ok: true,
        messageId,
        statusCode: response.status,
        retryable: false,
        throttled: false,
      };
    }

    const errorCode = typeof parsed?.Code === "string"
      ? parsed.Code
      : typeof parsed?.code === "string"
      ? parsed.code
      : typeof parsed?.__type === "string"
      ? parsed.__type
      : undefined;
    const errorMessage = typeof parsed?.Message === "string"
      ? parsed.Message
      : typeof parsed?.message === "string"
      ? parsed.message
      : `SES request failed with HTTP ${response.status}`;
    const classified = classifySesError(response.status, errorCode);
    return {
      ok: false,
      statusCode: response.status,
      errorCode,
      errorMessage,
      retryable: classified.retryable,
      throttled: classified.throttled,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected SES error";
    return {
      ok: false,
      statusCode: 0,
      errorCode: "NETWORK_ERROR",
      errorMessage: message,
      retryable: false,
      throttled: false,
    };
  }
};
