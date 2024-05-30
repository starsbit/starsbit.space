import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { FooterComponent } from '../../../../components/footer/footer.component';
import { HeaderComponent } from '../../../../components/header/header.component';
import { SocialLinksComponent } from '../../../../components/social-links/social-links.component';
import { SeoService } from '../../../../services/seo.service';
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

  filteredPosts: PostData[] = [];

  allTags: string[] = [];

  selectedFilter: string | null = null;

  private readonly _subscriptions = new Subscription();

  constructor(
    public readonly themeService: ThemeService,
    private readonly cdr: ChangeDetectorRef,
    private readonly blogPostDataClientService: BlogPostDataClientService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly seo: SeoService
  ) {}

  ngOnInit() {
    this.handleSeo();
    this.blogPostDataClientService.getBlogPostData().subscribe((data) => {
      this.posts = data.filter((post) => post.published);

      // sort by date with the most recent first
      console.log(this.posts);
      this.posts.sort((a, b) => b.date.getTime() - a.date.getTime());

      this.allTags = Array.from(
        new Set(this.posts.flatMap((post) => post.tags))
      );

      this.allTags.sort();

      this.selectedFilter = this.route.snapshot.queryParams['tag'];

      if (this.selectedFilter) {
        this.filteredPosts = this.posts.filter((post) =>
          post.tags.includes(this.selectedFilter!)
        );
      } else {
        this.filteredPosts = this.posts;
      }

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

  filterPosts(tag: string) {
    if (this.selectedFilter === tag) {
      this.selectedFilter = null;
      this.filteredPosts = this.posts;
      this.router.navigate([], {
        queryParams: { tag: null },
      });
      this.cdr.detectChanges();
      return;
    }
    this.selectedFilter = tag;
    this.filteredPosts = this.posts.filter((post) => post.tags.includes(tag));
    this.router.navigate([], {
      queryParams: { tag },
    });
    this.cdr.detectChanges();
  }

  private handleSeo() {
    this.seo.updateTitle('starsbit - Blog');
    this.seo.updateDescription(
      'Most recent posts from starsbit. Various topics are covered.'
    );
    this.seo.updateKeywords('blog, posts, articles, stars, starsbit');
    this.seo.updateAuthor('stars');
    this.seo.updateOgUrl('https://starsbit.space/blog');
    this.seo.updateOgTitle('starsbig - Blog');
    this.seo.updateOgDescription(
      'Most recent posts from starsbit. Various topics are covered.'
    );
    this.seo.updateOgImage('https://starsbit.space/assets/images/banner.png');
  }
}
