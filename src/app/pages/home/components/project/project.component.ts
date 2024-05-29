import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingService } from '../../../../services/loading.service';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'stars-project',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectComponent {
  @Input() thumbnail: string;
  @Input() thumbnailSecond: string;
  @Input() link: string;
  @Input() title: string;
  @Input() description: string;
  @Input() route: string;

  constructor(
    public readonly themeService: ThemeService,
    private readonly router: Router,
    private readonly loadingService: LoadingService
  ) {}

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.loadingService.start();
  }
}
