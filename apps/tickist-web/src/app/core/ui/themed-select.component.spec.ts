import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemedSelectComponent } from './themed-select.component';

describe('ThemedSelectComponent', () => {
  let fixture: ComponentFixture<ThemedSelectComponent>;
  let component: ThemedSelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemedSelectComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ThemedSelectComponent);
    component = fixture.componentInstance;
    component.options = [
      { value: true, label: 'Active' },
      { value: false, label: 'Archived' },
    ];
    component.writeValue(true);
    fixture.detectChanges();
  });

  it('keeps boolean form values when choosing an option', () => {
    const changed = vi.fn();
    component.registerOnChange(changed);
    trigger().click();
    fixture.detectChanges();

    expect(menu()).not.toBeNull();
    options()[1]?.click();
    fixture.detectChanges();

    expect(changed).toHaveBeenCalledWith(false);
    expect(component.selectedValue()).toBe(false);
    expect(trigger().textContent).toContain('Archived');
    expect(menu()).toBeNull();
  });

  it('opens with arrow keys and closes with Escape', () => {
    trigger().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    );
    fixture.detectChanges();
    expect(options()).toHaveLength(2);

    options()[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    fixture.detectChanges();
    expect(menu()).toBeNull();
  });

  it('respects the disabled form state', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(trigger().disabled).toBe(true);
    trigger().click();
    fixture.detectChanges();
    expect(menu()).toBeNull();
  });

  function trigger(): HTMLButtonElement {
    const button = fixture.nativeElement.querySelector(
      '.themed-select__trigger'
    );

    if (!(button instanceof HTMLButtonElement))
      throw new Error('Missing trigger');

    return button;
  }

  function menu(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.themed-select__menu');
  }

  function options(): HTMLButtonElement[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('.themed-select__option')
    );
  }
});
