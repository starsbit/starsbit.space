#

## Why Do You Need to Load Resources Before the Content Is Displayed to the User?

Often, it's enough to load the resources for a page after the page has been displayed. This should be the default behavior for most pages. However, there are some pages where it makes sense to load the resources before the page is displayed. For example, if you have a page that is very resource-intensive, you may want to load the resources before the page is displayed so that the user doesn't have to wait for the resources to load before they can interact with the page. Another case is if you work with certain animation libraries that require the resources to be loaded before triggering the animation.

On this website, I used the animation library `gsap`. There are images that need to be animated on this page, and `gsap` only triggered the animation for me when the images were fetched. The reason was that the bundles for `gsap` were not ready in time because the image fetching is blocking. This, coupled with the fact that I use a free hosting service that has a slow response time, led me to decide to load the resources/bundles before the page is displayed. This way, the user does not see a page with a random animation triggered long after first seeing the page.

## How Can You Load Resources Before the Page Is Displayed in Angular?

I solved this problem by utilizing the 'deferrable views' with the `@defer` keyword and some custom code for showing a loading spinner. For the `@defer` keyword, I suggest you read the [documentation](https://angular.dev/guide/defer). Here is a brief explanation of what it does:

"Deferrable views can be used in component template to defer the loading of select dependencies within that template. Those dependencies include components, directives, and pipes, and any associated CSS. To use this feature, you can declaratively wrap a section of your template in a `@defer` block which specifies the loading conditions." - [angular.dev](https://angular.dev/guide/defer)

Using the `@defer` keyword, I was able to load the bundles for the page before the page was displayed. This solved the problem of the animation not triggering because the bundles were not ready in time. The loading spinner was shown while the bundles were being fetched. The loading spinner was hidden when the bundles were fetched and the page was displayed.

To implement this behavior, I first made sure to lazy load my bundles in my `app.routes.ts` file.

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/defered-home.component').then(
        (m) => m.DeferedHomeComponent
      ),
  },
  {
    path: 'blog',
    loadChildren: () =>
      import('./pages/blog/blog.routes').then((m) => m.BLOG_ROUTES),
  },
  { path: '**', redirectTo: '' },
];
```

Then I created a `DeferedHomeComponent` that would load the resources before the home page was displayed.

```html
@defer (on immediate) {
    <stars-home></stars-home>
} @loading (after 100ms; minimum 500ms) {
    <stars-loading></stars-loading>
}
```

This component shows a loading spinner while the resources are being fetched. When the resources are fetched, the home page is displayed. With this logic in place, the animation problem was solved. The animation would play as soon as the page was displayed because the needed resources were already fetched.

A new problem comes with this solution. When dealing with resource-intensive pages and long content fetching times, triggering a route navigation will cause the navigation to be delayed. The reason is that the bundles for the next page need to be fetched before the navigation can happen. When other content needs to be fetched first, no feedback on the navigation is given to the user. This can be confusing for the user. To solve this issue, a manual loading spinner can be introduced.

```html
@defer (on immediate) { 
    @if (loadingService.isLoading() | async) {
        <stars-loading></stars-loading>
    } @else {
        <stars-home></stars-home>
    } 
} @loading (after 100ms; minimum 500ms) {
    <stars-loading></stars-loading>
}
```

The `LoadingService` can be implemented as follows:

```typescript
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
```

Now this service can be used like this:

```typescript
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { LoadingComponent } from '../../components/loading/loading.component';
import { LoadingService } from '../../services/loading.service';
import { HomeComponent } from './components/home/home.component';

@Component({
  selector: 'stars-defered-home',
  standalone: true,
  imports: [HomeComponent, LoadingComponent, AsyncPipe],
  templateUrl: './defered-home.component.html',
  styleUrl: './defered-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeferedHomeComponent implements OnInit {
  constructor(public readonly loadingService: LoadingService) {}

  ngOnInit() {
    this.loadingService.stop();
  }
}
```

When triggering a route navigation do it simply like this:

```typescript
navigate() {
    this.loadingService.start();
    this.router.navigate(['/']);
}
```

This way the user gets feedback on the trigger of the navigation and the the loading spinner is cleared when the page is ready to be displayed.

## Conclusion

The new Angular feature `@defer` is a powerful tool for loading resources before a component is displayed. It effectively addresses issues like the one I encountered with the animation library `gsap`. Additionally, using a `LoadingService` provides essential feedback to the user during route navigation, ensuring they are aware that the navigation is in progress.

However, this solution comes with trade-offs. The `LoadingService` requires maintenance, and the use of the `@defer` keyword in templates can make the code more complex and harder to maintain. Despite these challenges, the benefits of preloading resources—such as improved user experience and seamless animations—can outweigh the downsides. For this website, no other solution has effectively resolved the animation issue.

I will update this post if I find a better solution in the future. If you have any suggestions or questions, feel free to reach out to me on [Twitter](https://x.com/starsbit1).

## Update 31.05.2024

I found a better solution for the problem I described in this post. Instead of adding the `ngOnInit` function to every component and adding there the `this.loadingService.stop();` call, I added all the logic to the loading service, which is provided in `root`.

```typescript
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
```

I hope this helps!!
