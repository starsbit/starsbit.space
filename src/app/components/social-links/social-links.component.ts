import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'stars-social-links',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './social-links.component.html',
  styleUrl: './social-links.component.scss',
})
export class SocialLinksComponent {
  constructor(public readonly themeService: ThemeService) {}

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
}
