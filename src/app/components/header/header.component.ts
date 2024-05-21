import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'stars-header',
  standalone: true,
  imports: [RouterModule, NgClass],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  @Input() route: string | null = null;

  copyrightYear = new Date().getFullYear();

  constructor(public themeService: ThemeService) {}

  get imageSource() {
    return this.themeService.darkmode
      ? 'assets/images/starsbit_logo_transparent_white.png'
      : 'assets/images/starsbit_logo_transparent.png';
  }

  toggleDarkmode() {
    this.themeService.darkmode = !this.themeService.darkmode;
  }
}
