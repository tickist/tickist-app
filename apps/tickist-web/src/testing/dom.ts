import type { ComponentFixture } from '@angular/core/testing';

export function fixtureHost<T>(fixture: ComponentFixture<T>): HTMLElement {
  const host = fixture.nativeElement;

  if (!(host instanceof HTMLElement))
    throw new Error('Expected an HTML component fixture host.');

  return host;
}

export function requiredElement<T extends Element>(
  host: ParentNode,
  selector: string,
  elementType: { new (): T }
): T {
  const element = host.querySelector(selector);

  if (!(element instanceof elementType))
    throw new Error('Missing or unexpected element: ' + selector);

  return element;
}

export function elementsOfType<T extends Element>(
  host: ParentNode,
  selector: string,
  elementType: { new (): T }
): T[] {
  return Array.from(host.querySelectorAll(selector)).map((element) => {
    if (!(element instanceof elementType))
      throw new Error('Unexpected element: ' + selector);

    return element;
  });
}
