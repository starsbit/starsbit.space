import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, tap } from 'rxjs';
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
    return this.http.get<PostData[]>('/assets/data/blog-posts.json').pipe(
      tap((data) => {
        this.postData = data;
      })
    );
  }
}
