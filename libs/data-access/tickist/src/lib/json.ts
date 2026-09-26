import { z } from 'zod';

/** JSON transport values, validated before they reach domain code. */
export const JsonValueSchema = z.json();

export const JsonRecordSchema = z.record(z.string(), JsonValueSchema);

export type JsonValue = z.infer<typeof JsonValueSchema>;

export type JsonRecord = z.infer<typeof JsonRecordSchema>;
