import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../../../services/theme.service';

@Component({
  selector: 'stars-project',
  standalone: true,
  imports: [NgOptimizedImage, RouterLink],
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

  constructor(public readonly themeService: ThemeService) {}
}
