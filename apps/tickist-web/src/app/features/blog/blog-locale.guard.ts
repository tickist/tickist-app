import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isBlogLocale } from './blog-content';

/** Keeps the public blog URL space limited to explicitly supported locales. */
export const blogLocaleGuard: CanActivateFn = (route) => {
  const locale = route.paramMap.get('locale');

  if (isBlogLocale(locale)) {
    return true;
  }

  return inject(Router).parseUrl('/en/blog');
};
