import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingComponent } from '../../../../components/loading/loading.component';
import { NOT_FOUND_BLOG_POST } from '../../../../constants/not-found-blog-post';
import { BlogPostDataClientService } from '../../../../services/web/blog-post-data-client.service';
import { BlogPostComponent } from '../blog-post/blog-post.component';
import { PostData } from '../blog-post/post-data.model';

@Component({
  selector: 'stars-defered-blog-post',
  standalone: true,
  imports: [BlogPostComponent, LoadingComponent],
  templateUrl: './defered-blog-post.component.html',
  styleUrl: './defered-blog-post.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeferedBlogPostComponent {
  post: PostData;

  constructor(
    private router: Router,
    private blogPostDataClientService: BlogPostDataClientService
  ) {
    // Get current route and get the post id from the route
    const route = this.router.url.split('/');
    const routeId = route[route.length - 1];

    // Get the post data from the service
    this.blogPostDataClientService.getBlogPostData().subscribe((data) => {
      this.post =
        data.find((post) => post.route === routeId) || NOT_FOUND_BLOG_POST;
      if (!this.post.published) {
        this.post = NOT_FOUND_BLOG_POST;
      }
    });
  }
}
