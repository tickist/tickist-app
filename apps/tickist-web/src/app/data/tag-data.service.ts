import { Injectable, computed, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../config/supabase.provider';

export interface Tag {
  id: string;
  ownerId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TagCreateInput {
  ownerId: string;
  name: string;
}

export interface TagUpdateInput {
  id: string;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class TagDataService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly tags = signal<Tag[]>([]);
  private readonly loading = signal(false);

  readonly tagsSignal = computed(() => this.tags());
  readonly loadingSignal = computed(() => this.loading());

  constructor() {
    if (this.supabase) {
      void this.refresh();
    }
  }

  list() {
    return this.tagsSignal();
  }

  async refresh(): Promise<void> {
    if (!this.supabase) {
      this.tags.set([]);
      this.loading.set(false);
      console.warn('[Tags] Supabase client missing; skipping fetch.');
      return;
    }
    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('tags')
      .select('id, owner_id, name, created_at, updated_at');
    this.loading.set(false);
    if (error || !data) {
      console.warn('[Tags] Unable to fetch from Supabase', error);
      return;
    }
    this.tags.set(
      data.map((row) => ({
        id: row.id,
        ownerId: row.owner_id,
        name: row.name,
        createdAt: row.created_at ?? undefined,
        updatedAt: row.updated_at ?? undefined,
      }))
    );
  }

  async createTag(input: TagCreateInput): Promise<Tag | null> {
    if (!input.ownerId) {
      throw new Error('ownerId is required to create a tag');
    }

    if (!this.supabase) {
      console.warn('[Tags] Supabase client missing; cannot create tag.');
      return null;
    }

    const { data, error } = await this.supabase
      .from('tags')
      .insert({
        owner_id: input.ownerId,
        name: input.name,
      })
      .select('id, owner_id, name, created_at, updated_at')
      .single();

    if (error || !data) {
      console.error('[Tags] Failed to create tag', error);
      return null;
    }

    const created: Tag = {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      createdAt: data.created_at ?? undefined,
      updatedAt: data.updated_at ?? undefined,
    };
    this.tags.set([...this.tags(), created]);
    return created;
  }

  async updateTag(input: TagUpdateInput): Promise<Tag | null> {
    if (!this.supabase) {
      console.warn('[Tags] Supabase client missing; cannot update tag.');
      return null;
    }

    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name;

    if (Object.keys(payload).length) {
      const { error } = await this.supabase
        .from('tags')
        .update(payload)
        .eq('id', input.id);
      if (error) {
        console.error('[Tags] Failed to update tag', error);
        return null;
      }
    }

    await this.refresh();
    return this.tags().find((tag) => tag.id === input.id) ?? null;
  }

  async deleteTag(tagId: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn('[Tags] Supabase client missing; cannot delete tag.');
      return false;
    }
    const { error } = await this.supabase.from('tags').delete().eq('id', tagId);
    if (error) {
      console.error('[Tags] Failed to delete tag', error);
      return false;
    }
    this.tags.set(this.tags().filter((tag) => tag.id !== tagId));
    return true;
  }
}
