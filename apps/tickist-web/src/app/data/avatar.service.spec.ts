import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';
import { AvatarService } from './avatar.service';

describe('AvatarService', () => {
  const upload = vi.fn();
  const getPublicUrl = vi.fn();
  const remove = vi.fn();
  const from = vi.fn(() => ({ upload, getPublicUrl, remove }));

  beforeEach(() => {
    upload.mockReset();
    getPublicUrl.mockReset();
    remove.mockReset();
    from.mockClear();

    TestBed.configureTestingModule({
      providers: [
        AvatarService,
        {
          provide: SupabaseSessionService,
          useValue: {
            user: () => ({ id: 'user-123' }),
          },
        },
        {
          provide: SUPABASE_CLIENT,
          useValue: {
            storage: { from },
          } as unknown as SupabaseClient,
        },
      ],
    });
  });

  it('rejects unsupported file type', () => {
    const service = TestBed.inject(AvatarService);
    const file = new File(['content'], 'avatar.gif', { type: 'image/gif' });
    const result = service.validateAvatarFile(file);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Allowed formats');
  });

  it('uploads avatar to user path and returns public URL', async () => {
    const service = TestBed.inject(AvatarService);
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    upload.mockResolvedValue({ error: null });
    getPublicUrl.mockReturnValue({
      data: {
        publicUrl:
          'https://project.supabase.co/storage/v1/object/public/avatars/user-123/avatar',
      },
    });

    const result = await service.uploadAvatar(file);

    expect(from).toHaveBeenCalledWith('avatars');
    expect(upload).toHaveBeenCalledWith(
      'user-123/avatar',
      file,
      expect.objectContaining({
        upsert: true,
        contentType: 'image/png',
      })
    );
    expect(result.objectPath).toBe('user-123/avatar');
    expect(result.publicUrl).toContain('/avatars/user-123/avatar');
  });

  it('removes avatar using current user path fallback', async () => {
    const service = TestBed.inject(AvatarService);
    remove.mockResolvedValue({ error: null });

    await service.removeAvatar(null);

    expect(from).toHaveBeenCalledWith('avatars');
    expect(remove).toHaveBeenCalledWith(['user-123/avatar']);
  });
});
