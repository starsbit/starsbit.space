import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _themeChangeSubject = new ReplaySubject<boolean>(1);

  public isDarkMode$ = this._themeChangeSubject.asObservable();

  private _darkmode = false;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this._darkmode =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;

      this.initialSetup();

      this._themeChangeSubject.next(this._darkmode);
    }
  }

  get darkmode() {
    return this._darkmode;
  }

  set darkmode(value: boolean) {
    this._darkmode = value;

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this._darkmode) {
      document.documentElement.classList.add('dark');
    } else if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
    }

    this._themeChangeSubject.next(value);
  }

  private initialSetup() {
    if (this._darkmode) {
      document.documentElement.classList.add('dark');
    }
  }
}
