import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingService } from '../../services/loading.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'stars-header',
  standalone: true,
  imports: [NgClass],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Input() route: string | null = null;
  @Input() backIcon = false;

  copyrightYear = new Date().getFullYear();

  constructor(
    public themeService: ThemeService,
    private readonly router: Router,
    private readonly loadingService: LoadingService
  ) {}

  get imageSource() {
    return this.themeService.darkmode
      ? 'assets/images/starsbit_logo_transparent_white.png'
      : 'assets/images/starsbit_logo_transparent.png';
  }

  toggleDarkmode() {
    this.themeService.darkmode = !this.themeService.darkmode;
  }

  navigate() {
    this.loadingService.start();
    this.router.navigate([this.route || '/']);
  }
}
