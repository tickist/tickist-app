import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppViewStateService } from '../app-shell/app-view-state.service';
import { ComposerModalService } from './composer-modal.service';

describe('ComposerModalService task defaults', () => {
  let service: ComposerModalService;
  let navigate: ReturnType<typeof vi.fn>;
  const router = {
    url: '/app',
    navigate: vi.fn(async () => true),
    navigateByUrl: vi.fn(async () => true),
  };

  beforeEach(() => {
    navigate = vi.fn(async () => true);
    router.navigate = navigate;
    router.url = '/app';

    TestBed.configureTestingModule({
      providers: [
        ComposerModalService,
        { provide: Router, useValue: router },
        {
          provide: AppViewStateService,
          useValue: { lastNonSheetAppUrl: () => null },
        },
      ],
    });
    service = TestBed.inject(ComposerModalService);
  });

  it('uses the active project when creating a task from its list', async () => {
    router.url = '/app/tasks/project-123';

    await service.openTaskModal();

    expect(navigate).toHaveBeenCalledWith(['/app/task/new'], {
      queryParams: { projectId: 'project-123' },
    });
  });

  it('keeps Inbox fallback outside a project list', async () => {
    router.url = '/app';

    await service.openTaskModal();

    expect(navigate).toHaveBeenCalledWith(['/app/task/new'], {
      queryParams: undefined,
    });
  });

  it('preserves an explicitly selected project', async () => {
    router.url = '/app/tasks/active-project';

    await service.openTaskModal({
      mode: 'create',
      defaults: { projectId: 'explicit-project' },
    });

    expect(navigate).toHaveBeenCalledWith(['/app/task/new'], {
      queryParams: { projectId: 'explicit-project' },
    });
  });
});
