import { Routes } from '@angular/router';

export const BLOG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./blog.component').then((m) => m.BlogComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/blog-post/blog-post.component').then(
        (m) => m.BlogPostComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
