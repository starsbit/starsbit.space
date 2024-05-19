import {
  CommonModule,
  isPlatformBrowser,
  NgOptimizedImage,
} from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import gsap from 'gsap';
import { Subscription } from 'rxjs';
import { FooterComponent } from '../../components/footer/footer.component';
import { LoadingComponent } from '../../components/loading/loading.component';
import { SocialLinksComponent } from '../../components/social-links/social-links.component';
import { ThemeService } from '../../services/theme.service';
import { ProjectComponent } from './components/project/project.component';

@Component({
  selector: 'stars-home',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    ProjectComponent,
    SocialLinksComponent,
    FooterComponent,
    LoadingComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  copyrightYear = new Date().getFullYear();
  spin = false;

  private readonly _subscriptions = new Subscription();

  constructor(
    public readonly themeService: ThemeService,
    private readonly cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngAfterViewInit() {
    this._subscriptions.add(
      this.themeService.isDarkMode$.subscribe(() => {
        this.cdr.detectChanges();
      })
    );

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const timeline = gsap.timeline({
      defaults: {
        ease: 'power3.out',
      },
    });

    timeline
      .from(
        '.header-item',
        {
          duration: 0.4,
          y: '-1000',
          stagger: 0.1,
          opacity: 0,
        },
        0
      )
      .from(
        '.name',
        {
          x: '-100',
          duration: 0.4,
          opacity: 0,
        },
        0.3
      )
      .from(
        '.description-item',
        {
          y: '100',
          opacity: 0,
          duration: 0.4,
          stagger: 0.1,
        },
        0.6
      )
      .from(
        '.splitter, .projects-header',
        {
          x: '-100%',
          duration: 0.4,
          opacity: 0,
        },
        0.8
      )
      .from(
        '.project',
        {
          y: 100,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
        },
        1.0
      )
      .from(
        '.social-link, .social-link-dark',
        {
          y: 100,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
        },
        1.4
      );
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }

  toggleDarkmode() {
    this.themeService.darkmode = !this.themeService.darkmode;
  }

  get svgFilterCssClass() {
    if (this.themeService.darkmode) {
      return 'filter-white';
    }
    return 'filter-black';
  }

  get socialLinkCssClass() {
    if (this.themeService.darkmode) {
      return 'social-link-dark';
    }
    return 'social-link';
  }

  get imageSource() {
    return this.themeService.darkmode
      ? 'assets/images/starsbit_logo_transparent_white.png'
      : 'assets/images/starsbit_logo_transparent.png';
  }

  spinLogo() {
    this.spin = true;
    setTimeout(() => {
      this.spin = false;
      this.cdr.detectChanges();
    }, 500);
  }
}
