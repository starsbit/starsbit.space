import { DatePipe, NgClass, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MarkdownComponent, MarkdownModule } from 'ngx-markdown';
import { FooterComponent } from '../../../../components/footer/footer.component';
import { HeaderComponent } from '../../../../components/header/header.component';
import { LoadingComponent } from '../../../../components/loading/loading.component';
import { SocialLinksComponent } from '../../../../components/social-links/social-links.component';
import { SeoService } from '../../../../services/seo.service';
import { BlogPostOutlineComponent } from './blog-post-outline/blog-post-outline.component';
import { PostData } from './post-data.model';

@Component({
  selector: 'stars-blog-post',
  standalone: true,
  imports: [
    NgClass,
    RouterLink,
    MarkdownModule,
    HeaderComponent,
    FooterComponent,
    SocialLinksComponent,
    NgOptimizedImage,
    LoadingComponent,
    DatePipe,
    BlogPostOutlineComponent,
  ],
  templateUrl: './blog-post.component.html',
  styleUrl: './blog-post.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostComponent implements OnInit {
  @Input() postData: PostData;

  @ViewChild(MarkdownComponent) markdownComponent: MarkdownComponent;

  markdownRendered = false;

  constructor(private readonly seo: SeoService) {}

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
}
