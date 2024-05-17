import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { BlogData } from '../blog-post/blog-post.model';

@Component({
  selector: 'stars-blog-post-card',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './blog-post-card.component.html',
  styleUrl: './blog-post-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostCardComponent {
  @Input() post: BlogData;

  constructor(private router: Router) {}

  onClick(event: MouseEvent) {
    this.router.navigate(['/blog', this.post.route]);
  }
}
