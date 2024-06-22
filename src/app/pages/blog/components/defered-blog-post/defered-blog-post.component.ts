import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingComponent } from '../../../../components/loading/loading.component';
import { NOT_FOUND_BLOG_POST } from '../../../../constants/not-found-blog-post';
import { LoadingService } from '../../../../services/loading.service';
import { SeoService } from '../../../../services/seo.service';
import { BlogPostDataClientService } from '../../../../services/web/blog-post-data-client.service';
import { BlogPostComponent } from '../blog-post/blog-post.component';
import { PostData } from '../blog-post/post-data.model';

@Component({
  selector: 'stars-defered-blog-post',
  standalone: true,
  imports: [BlogPostComponent, LoadingComponent, AsyncPipe],
  templateUrl: './defered-blog-post.component.html',
  styleUrl: './defered-blog-post.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeferedBlogPostComponent implements OnInit {
  post: PostData;

  constructor(
    public readonly loadingService: LoadingService,
    private readonly router: Router,
    private readonly blogPostDataClientService: BlogPostDataClientService,
    private readonly seo: SeoService
  ) {
    // Get current route and get the post id from the route
    const route = this.router.url.split('/');
    // Get the last element of the route array and remove the fragment if it exists
    const routeId = route[route.length - 1].split('#')[0];

    // Get the post data from the service
    this.blogPostDataClientService.getBlogPostData().subscribe((data) => {
      this.post =
        data.find((post) => post.route === routeId) || NOT_FOUND_BLOG_POST;
      if (!this.post.published) {
        this.post = NOT_FOUND_BLOG_POST;
      }
    });
  }

  ngOnInit() {
    this.seo.updateTitle(this.post.title);
    this.seo.updateDescription(this.post.description);
    this.seo.updateKeywords(this.post.tags.join(', '));
    this.seo.updateAuthor('stars');
    this.seo.updateOgUrl(`https://starsbit.space/blog/${this.post.route}`);
    this.seo.updateOgTitle(this.post.title);
    this.seo.updateOgDescription(this.post.description);
    this.seo.updateOgImage(`https://starsbit.space/${this.post.thumbnail}`);
  }
}
