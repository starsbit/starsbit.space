import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _darkmode = false;

  constructor() {}

  get darkmode() {
    return this._darkmode;
  }

  set darkmode(value: boolean) {
    this._darkmode = value;
  }
}
