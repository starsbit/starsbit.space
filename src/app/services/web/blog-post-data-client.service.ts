import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BlogData } from '../../pages/blog/components/blog-post/blog-post.model';

@Injectable({
  providedIn: 'root',
})
export class BlogPostDataClientService {
  constructor(private readonly http: HttpClient) {}

  getBlogPostData() {
    return this.http.get<BlogData[]>('/assets/data/blog-posts.json');
  }
}
