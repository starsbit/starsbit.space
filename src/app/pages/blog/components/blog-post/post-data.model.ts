export interface PostData {
  title: string;
  description: string;
  date: Date;
  image: string;
  thumbnail: string;
  tags: string[];
  route: string;
  published: boolean;
  file: string;
  author: string;
  sources: PostSource[];
}

export interface PostSource {
  id: string;
  title: string;
  url: string;
}
