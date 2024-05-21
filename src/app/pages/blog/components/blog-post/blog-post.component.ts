import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MarkdownModule } from 'ngx-markdown';
import { FooterComponent } from '../../../../components/footer/footer.component';
import { HeaderComponent } from '../../../../components/header/header.component';
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
  ],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostComponent {
  @Input() postData: PostData;
}
