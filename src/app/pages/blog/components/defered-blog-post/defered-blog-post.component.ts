import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoadingComponent } from '../../../../components/loading/loading.component';
import { BlogPostComponent } from '../blog-post/blog-post.component';

@Component({
  selector: 'stars-defered-blog-post',
  standalone: true,
  imports: [BlogPostComponent, LoadingComponent],
  templateUrl: './defered-blog-post.component.html',
  styleUrl: './defered-blog-post.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeferedBlogPostComponent {}
