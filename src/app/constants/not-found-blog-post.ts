import { PostData } from '../pages/blog/components/blog-post/post-data.model';

export const NOT_FOUND_BLOG_POST: PostData = {
  title: 'Post not found',
  date: new Date(),
  route: 'post-not-found',
  published: false,
  tags: [],
  description: 'The requested post was not found',
  image: '/assets/images/banner.png',
  thumbnail: '',
  file: '/assets/data/blog-posts/not-found.md',
};
