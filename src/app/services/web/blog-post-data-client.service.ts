import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, tap } from 'rxjs';
import POST_DATA from '../../../assets/data/blog-posts.json';
import { PostData } from '../../pages/blog/components/blog-post/post-data.model';

@Injectable({
  providedIn: 'root',
})
export class BlogPostDataClientService {
  private postData: PostData[];

  constructor(private readonly http: HttpClient) {}

  getBlogPostData() {
    if (this.postData) {
      return of(this.postData);
    }
    // Use this if you find a way to make SSR work with Cloudflare Workers
    // return this.http.get<PostData[]>('/assets/data/blog-posts.json')
    const postData = POST_DATA as unknown as PostData[];
    return of(postData).pipe(
      tap((data) => {
        data.forEach((post) => {
          const date = post.date as unknown as string;
          // First try dates of the form 1969-12-31T23:00:00.000Z
          if (post.date instanceof Date) {
            return;
          }
          // Then try dates of the form 2021-06-23
          if (date.includes('-')) {
            post.date = new Date(post.date);
            return;
          }
          const [day, month, year] = date.split('.');
          post.date = new Date(Number(year), Number(month) - 1, Number(day));
        });
        this.postData = data;
      })
    );
  }

  getBlogPostFile(url: string) {
    return this.http.get(url, { responseType: 'text' });
  }
}
