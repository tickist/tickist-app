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
    component.ariaLabel = 'Status';
    component.writeValue(true);
    fixture.detectChanges();
  });

  it('renders a native select with an accessible name and the current value', () => {
    expect(select().getAttribute('aria-label')).toBe('Status');
    expect(select().selectedOptions[0]?.textContent?.trim()).toBe('Active');
  });

  it('keeps boolean form values when choosing an option', () => {
    const changed = vi.fn();
    const touched = vi.fn();
    const emitted = vi.fn();
    component.registerOnChange(changed);
    component.registerOnTouched(touched);
    component.valueChange.subscribe(emitted);

    choose(1);

    expect(changed).toHaveBeenCalledWith(false);
    expect(emitted).toHaveBeenCalledWith(false);
    expect(touched).toHaveBeenCalled();
    expect(component.selectedValue()).toBe(false);
    expect(select().selectedOptions[0]?.textContent?.trim()).toBe('Archived');
  });

  it('reflects values written by the form', () => {
    component.writeValue(false);
    fixture.detectChanges();

    expect(select().selectedIndex).toBe(1);
  });

  it('respects the disabled form state', () => {
    component.setDisabledState(true);
    fixture.detectChanges();

    expect(select().disabled).toBe(true);
  });

  function select(): HTMLSelectElement {
    const element = fixture.nativeElement.querySelector('select');

    if (!(element instanceof HTMLSelectElement))
      throw new Error('Missing select');

    return element;
  }

  function choose(index: number): void {
    select().selectedIndex = index;
    select().dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }
});
