import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { LoadingComponent } from '../../components/loading/loading.component';
import { LoadingService } from '../../services/loading.service';
import { SeoService } from '../../services/seo.service';
import { BlogComponent } from './components/blog/blog.component';

@Component({
  selector: 'stars-defered-blog',
  standalone: true,
  imports: [BlogComponent, LoadingComponent, AsyncPipe],
  templateUrl: './defered-blog.component.html',
  styleUrl: './defered-blog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeferedBlogComponent implements OnInit {
  constructor(
    public readonly loadingService: LoadingService,
    private readonly seo: SeoService
  ) {}

  ngOnInit() {
    this.handleSeo();
  }

  private handleSeo() {
    this.seo.updateTitle('starsbit - Blog');
    this.seo.updateDescription(
      'Most recent posts from starsbit. Various topics are covered.'
    );
    this.seo.updateKeywords('blog, posts, articles, stars, starsbit');
    this.seo.updateAuthor('stars');
    this.seo.updateOgUrl('https://starsbit.space/blog');
    this.seo.updateOgTitle('starsbig - Blog');
    this.seo.updateOgDescription(
      'Most recent posts from starsbit. Various topics are covered.'
    );
    this.seo.updateOgImage('https://starsbit.space/assets/images/banner.png');
  }
}
