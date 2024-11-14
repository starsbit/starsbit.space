import { DatePipe, NgClass, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MarkdownComponent, MarkdownModule } from 'ngx-markdown';
import { FooterComponent } from '../../../../components/footer/footer.component';
import { HeaderComponent } from '../../../../components/header/header.component';
import { LoadingComponent } from '../../../../components/loading/loading.component';
import { SocialLinksComponent } from '../../../../components/social-links/social-links.component';
import { BlogPostDataClientService } from '../../../../services/web/blog-post-data-client.service';
import { BlogPostOutlineComponent } from './blog-post-outline/blog-post-outline.component';
import { PostData } from './post-data.model';

@Component({
  selector: 'stars-blog-post',
  standalone: true,
  imports: [
    NgClass,
    RouterLink,
    MarkdownModule,
    MatIconModule,
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

  timeToRead = '?';

  constructor(
    private readonly blogPostDataClientService: BlogPostDataClientService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.blogPostDataClientService
      .getBlogPostFile(this.postData.file)
      .subscribe((data) => {
        this.timeToRead = this.calculateReadingTime(data).toString();
        this.cdr.markForCheck();
      });
  }

  calculateReadingTime(markdownContent: string): number {
    // Step 1: Remove Markdown formatting
    const plainText = markdownContent
      .replace(/[#*_~`>-\[\]\(\)]+/g, ' ') // Remove Markdown symbols like #, *, _, etc.
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' '); // Consolidate multiple spaces

    // Step 2: Split the text into words
    const words = plainText.trim().split(' ');

    // Step 3: Calculate reading time
    const wordsPerMinute = 200; // Average reading speed
    const readingTime = Math.ceil(words.length / wordsPerMinute);

    return readingTime; // returns the reading time in minutes
  }
}
