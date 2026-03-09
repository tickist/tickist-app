/* eslint-disable playwright/no-standalone-expect */
import { describe, expect, it } from 'vitest';
import {
  TickistExportDocument,
  parseTickistExportDocument,
  validateTickistExportDocument,
} from './export-import.service';

describe('ExportImportService helpers', () => {
  it('rejects malformed JSON payload', () => {
    const parsed = parseTickistExportDocument('{invalid');
    expect(parsed.ok).toBe(false);
  });

  it('accepts valid payload and computes summary', () => {
    const payload = createPayload();
    const validation = validateTickistExportDocument(payload);

    expect(validation.ok).toBe(true);
    expect(validation.summary.projects).toBe(1);
    expect(validation.summary.tags).toBe(1);
    expect(validation.summary.tasks).toBe(1);
    expect(validation.summary.taskSteps).toBe(1);
    expect(validation.summary.taskTags).toBe(1);
  });

  it('reports duplicate stable IDs as errors', () => {
    const payload = createPayload();
    payload.tasks.push({
      ...payload.tasks[0],
      name: 'Duplicated',
      stableId: 'task-1',
    });

    const validation = validateTickistExportDocument(payload);

    expect(validation.ok).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('Duplicate task stableId')
      )
    ).toBe(true);
  });

  it('reports dangling references as warnings', () => {
    const payload = createPayload();
    payload.taskTags.push({
      tagStableId: 'missing-tag',
      taskStableId: 'task-1',
    });

    const validation = validateTickistExportDocument(payload);

    expect(validation.ok).toBe(true);
    expect(
      validation.warnings.some((warning) =>
        warning.includes('references missing tag')
      )
    ).toBe(true);
  });
});

function createPayload(): TickistExportDocument {
  return {
    format: 'tickist-json',
    formatVersion: 1,
    exportedAt: '2026-02-26T00:00:00.000Z',
    sourceInstance: 'https://demo.supabase.co',
    filters: {
      onlyActive: false,
      projectIds: [],
    },
    projects: [
      {
        stableId: 'project-1',
        name: 'Inbox',
        description: '',
        color: '#394264',
        icon: 'inbox',
        isActive: true,
        isInbox: true,
        projectType: 'active',
        ancestorStableId: null,
        taskView: 'extended',
        defaultPriority: 'normal',
        defaultFinishDate: null,
        defaultTypeFinishDate: null,
        dialogTimeWhenTaskFinished: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ],
    tags: [
      {
        stableId: 'tag-1',
        name: 'Work',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    tasks: [
      {
        stableId: 'task-1',
        projectStableId: 'project-1',
        name: 'Task',
        description: '',
        finishDate: null,
        finishTime: null,
        suspendUntil: null,
        pinned: false,
        isActive: true,
        isDone: false,
        onHold: false,
        typeFinishDate: 1,
        priority: 'normal',
        repeatInterval: 0,
        repeatDelta: null,
        fromRepeating: null,
        estimateMinutes: null,
        spentMinutes: null,
        taskType: 'normal',
        whenComplete: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ],
    taskSteps: [
      {
        stableId: 'step-1',
        taskStableId: 'task-1',
        content: 'Do a thing',
        isDone: false,
        position: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    taskTags: [
      {
        taskStableId: 'task-1',
        tagStableId: 'tag-1',
      },
    ],
  };
}
