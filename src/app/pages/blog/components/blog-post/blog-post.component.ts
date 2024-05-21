import { DatePipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { FooterComponent } from '../../../../components/footer/footer.component';
import { HeaderComponent } from '../../../../components/header/header.component';
import { LoadingComponent } from '../../../../components/loading/loading.component';
import { SocialLinksComponent } from '../../../../components/social-links/social-links.component';
import { PostData } from './post-data.model';

@Component({
  selector: 'stars-blog-post',
  standalone: true,
  imports: [
    MarkdownModule,
    HeaderComponent,
    FooterComponent,
    SocialLinksComponent,
    NgOptimizedImage,
    LoadingComponent,
    DatePipe,
  ],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostComponent {
  @Input() postData: PostData;

  markdownRendered = false;

  constructor(private readonly router: Router) {}

  onTagClick(tag: string) {
    this.router.navigate(['/blog'], { queryParams: { tag } });
  }
}
