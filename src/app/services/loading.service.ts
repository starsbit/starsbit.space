import { Injectable } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { BehaviorSubject, filter, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private callCount = 0;
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  constructor(private readonly router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.stop();
      });

    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => {
        this.start();
      });
  }

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

  isLoadingSnapshot(): boolean {
    return this.loadingSubject.value;
  }
}
