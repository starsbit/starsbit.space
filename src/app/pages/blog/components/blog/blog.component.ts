import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { FooterComponent } from '../../../../components/footer/footer.component';
import { HeaderComponent } from '../../../../components/header/header.component';
import { SocialLinksComponent } from '../../../../components/social-links/social-links.component';
import { ThemeService } from '../../../../services/theme.service';
import { BlogPostDataClientService } from '../../../../services/web/blog-post-data-client.service';
import { BlogPostCardComponent } from '../blog-post-card/blog-post-card.component';
import { PostData } from '../blog-post/post-data.model';

@Component({
  selector: 'stars-blog',
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    SocialLinksComponent,
    FooterComponent,
    HeaderComponent,
    BlogPostCardComponent,
  ],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogComponent implements AfterViewInit, OnDestroy, OnInit {
  posts: PostData[] = [];

  private readonly _subscriptions = new Subscription();

  constructor(
    public readonly themeService: ThemeService,
    private readonly cdr: ChangeDetectorRef,
    private readonly blogPostDataClientService: BlogPostDataClientService
  ) {}

  ngOnInit() {
    this.blogPostDataClientService.getBlogPostData().subscribe((data) => {
      this.posts = data.filter((post) => post.published);
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    this._subscriptions.add(
      this.themeService.isDarkMode$.subscribe(() => {
        this.cdr.detectChanges();
      })
    );
  }

  ngOnDestroy() {
    this._subscriptions.unsubscribe();
  }
}
