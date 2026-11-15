import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(document, 'ariaNotify');
  });

  it('announces through the persistent live region without ariaNotify', () => {
    const service = TestBed.inject(ToastService);

    service.success('Task saved');
    expect(service.announcement()).toBe('');

    vi.advanceTimersByTime(100);
    expect(service.announcement()).toBe('Task saved');
  });

  it('uses ariaNotify when available, with high priority for errors', () => {
    const ariaNotify = vi.fn();
    Object.defineProperty(document, 'ariaNotify', {
      configurable: true,
      value: ariaNotify,
    });
    const service = TestBed.inject(ToastService);

    expect(TestBed.inject(DOCUMENT)).toBe(document);
    service.error('Could not save');
    service.infoWithAction('Task deleted', 'Undo', () => undefined);

    expect(ariaNotify).toHaveBeenNthCalledWith(1, 'Could not save', {
      priority: 'high',
    });
    expect(ariaNotify).toHaveBeenNthCalledWith(
      2,
      'Task deleted Actions available.',
      { priority: 'normal' }
    );
    vi.advanceTimersByTime(100);
    expect(service.announcement()).toBe('');
  });

  it('keeps a paused toast until it is resumed and its time runs out', () => {
    const service = TestBed.inject(ToastService);

    service.info('Synced', 1000);
    const id = service.toasts()[0]?.id ?? '';

    service.pause(id);
    vi.advanceTimersByTime(5000);
    expect(service.toasts()).toHaveLength(1);

    service.resume(id);
    vi.advanceTimersByTime(999);
    expect(service.toasts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(service.toasts()).toHaveLength(0);
  });

  it('never auto-dismisses a toast with an action', () => {
    const service = TestBed.inject(ToastService);

    service.infoWithAction('Task deleted', 'Undo', () => undefined);
    const id = service.toasts()[0]?.id ?? '';

    service.pause(id);
    service.resume(id);
    vi.advanceTimersByTime(60_000);
    expect(service.toasts()).toHaveLength(1);
  });
});
