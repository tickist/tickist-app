import { Injectable, inject } from '@angular/core';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';

export interface AvatarUploadResult {
  publicUrl: string;
  objectPath: string;
}

export interface AvatarFileValidation {
  ok: boolean;
  reason?: string;
}

const AVATAR_BUCKET = 'avatars';
const AVATAR_OBJECT_NAME = 'avatar';
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const AVATAR_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

@Injectable({ providedIn: 'root' })
export class AvatarService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly session = inject(SupabaseSessionService);

  validateAvatarFile(file: File | null): AvatarFileValidation {
    if (!file) {
      return { ok: false, reason: 'Please choose an image file.' };
    }
    if (!AVATAR_MIME_TYPES.has(file.type)) {
      return { ok: false, reason: 'Allowed formats: PNG, JPG or WEBP.' };
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return { ok: false, reason: 'Avatar must be smaller than 2 MB.' };
    }
    return { ok: true };
  }

  async uploadAvatar(file: File): Promise<AvatarUploadResult> {
    const validation = this.validateAvatarFile(file);
    if (!validation.ok) {
      throw new Error(validation.reason ?? 'Invalid avatar file.');
    }

    const client = this.ensureClient();
    const userId = this.ensureUserId();
    const objectPath = this.buildAvatarObjectPath(userId);

    const { error } = await client.storage.from(AVATAR_BUCKET).upload(objectPath, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: '3600',
    });
    if (error) {
      throw new Error(`Avatar upload failed: ${error.message}`);
    }

    const { data } = client.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
    const publicUrl = data.publicUrl?.trim();
    if (!publicUrl) {
      throw new Error('Could not resolve avatar URL after upload.');
    }

    return { publicUrl, objectPath };
  }

  async removeAvatar(objectPath?: string | null): Promise<void> {
    const client = this.ensureClient();
    const userId = this.ensureUserId();
    const fallbackPath = this.buildAvatarObjectPath(userId);
    const paths = [...new Set([objectPath, fallbackPath].filter(isNonEmptyString))];

    if (!paths.length) {
      return;
    }

    const { error } = await client.storage.from(AVATAR_BUCKET).remove(paths);
    if (error) {
      throw new Error(`Avatar delete failed: ${error.message}`);
    }
  }

  private ensureClient() {
    if (!this.supabase) {
      throw new Error(
        'Supabase is not configured. Provide NG_APP_SUPABASE_URL and NG_APP_SUPABASE_PUBLISHABLE_KEY.'
      );
    }
    return this.supabase;
  }

  private ensureUserId(): string {
    const userId = this.session.user()?.id?.trim();
    if (!userId) {
      throw new Error('You must be signed in to manage avatar.');
    }
    return userId;
  }

  private buildAvatarObjectPath(userId: string): string {
    return `${userId}/${AVATAR_OBJECT_NAME}`;
  }
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
