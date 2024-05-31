import { DatePipe, NgClass, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { FooterComponent } from '../../../../components/footer/footer.component';
import { HeaderComponent } from '../../../../components/header/header.component';
import { LoadingComponent } from '../../../../components/loading/loading.component';
import { SocialLinksComponent } from '../../../../components/social-links/social-links.component';
import { SeoService } from '../../../../services/seo.service';
import { PostData } from './post-data.model';

@Component({
  selector: 'stars-blog-post',
  standalone: true,
  imports: [
    NgClass,
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
export class BlogPostComponent implements OnInit {
  @Input() postData: PostData;

  markdownRendered = false;

  constructor(
    private readonly router: Router,
    private readonly seo: SeoService
  ) {}

  ngOnInit() {
    this.seo.updateTitle(this.postData.title);
    this.seo.updateDescription(this.postData.description);
    this.seo.updateKeywords(this.postData.tags.join(', '));
    this.seo.updateAuthor('stars');
    this.seo.updateOgUrl(`https://starsbit.space/blog/${this.postData.route}`);
    this.seo.updateOgTitle(this.postData.title);
    this.seo.updateOgDescription(this.postData.description);
    this.seo.updateOgImage(`https://starsbit.space/${this.postData.thumbnail}`);
  }

  onTagClick(tag: string) {
    this.router.navigate(['/blog'], { queryParams: { tag } });
  }
}
