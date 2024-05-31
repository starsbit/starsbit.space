import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';

export const LOCAL_STORAGE_KEYS = {
  THEME: 'theme',
};

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  localStorage: Storage;

  constructor(@Inject(PLATFORM_ID) private platformId: string) {
    if (!isPlatformBrowser(this.platformId) || !document.defaultView) {
      return;
    }
    this.localStorage = document.defaultView.localStorage;
  }

  setTheme(theme: string) {
    this.setLocalStorage(LOCAL_STORAGE_KEYS.THEME, theme);
  }

  getTheme() {
    return this.getLocalStorage(LOCAL_STORAGE_KEYS.THEME);
  }

  setLocalStorage(name: string, value: string) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.localStorage.setItem(name, value);
  }

  getLocalStorage(name: string) {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }
    return this.localStorage.getItem(name);
  }
}
