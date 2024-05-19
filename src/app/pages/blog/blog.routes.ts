import { Routes } from '@angular/router';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./defered-blog.component').then((m) => m.DeferedBlogComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/defered-blog-post/defered-blog-post.component').then(
        (m) => m.DeferedBlogPostComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
