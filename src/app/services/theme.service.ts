import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly _themeChangeSubject = new BehaviorSubject<boolean>(false);

  public isDarkMode$ = this._themeChangeSubject.asObservable();

  private _darkmode = false;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this._darkmode =
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;

      this._themeChangeSubject.next(this._darkmode);
    }
  }

  get darkmode() {
    return this._darkmode;
  }

  set darkmode(value: boolean) {
    this._darkmode = value;
    this._themeChangeSubject.next(value);
  }
}
