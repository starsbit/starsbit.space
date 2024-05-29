import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private callCount = 0;
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  constructor() {}

  start() {
    this.callCount++;
    this.loadingSubject.next(true);
  }

  stop() {
    this.callCount--;
    if (this.callCount <= 0) {
      this.callCount = 0;
      this.loadingSubject.next(false);
    }
  }

  isLoading(): Observable<boolean> {
    return this.loadingSubject.asObservable();
  }
}
