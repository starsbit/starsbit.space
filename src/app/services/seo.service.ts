import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(private readonly title: Title, private readonly meta: Meta) {}

  updateTitle(title: string): void {
    this.title.setTitle(title);
  }

  updateDescription(description: string): void {
    this.meta.updateTag({ name: 'description', content: description });
  }

  updateKeywords(keywords: string): void {
    this.meta.updateTag({ name: 'keywords', content: keywords });
  }

  updateAuthor(author: string): void {
    this.meta.updateTag({ name: 'author', content: author });
  }

  updateOgUrl(url: string): void {
    this.meta.updateTag({ property: 'og:url', content: url });
  }

  updateOgTitle(title: string): void {
    this.meta.updateTag({ property: 'og:title', content: title });
  }

  updateOgDescription(description: string): void {
    this.meta.updateTag({ property: 'og:description', content: description });
  }

  updateOgImage(imageUrl: string): void {
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
  }
}
