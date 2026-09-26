import { z } from 'zod';

const OptionalProfileText = z.string().optional().catch(undefined);

export const ProfileMetadataSchema = z.object({
  full_name: OptionalProfileText,
  name: OptionalProfileText,
  avatar_url: OptionalProfileText,
  avatar_path: OptionalProfileText,
  avatar_version: OptionalProfileText,
});

export type ProfileMetadata = z.infer<typeof ProfileMetadataSchema>;
