import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoadingComponent } from '../../components/loading/loading.component';
import { LoadingService } from '../../services/loading.service';
import { SeoService } from '../../services/seo.service';
import { HomeComponent } from './components/home/home.component';

@Component({
  selector: 'stars-defered-home',
  standalone: true,
  imports: [HomeComponent, LoadingComponent, AsyncPipe],
  templateUrl: './defered-home.component.html',
  styleUrl: './defered-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeferedHomeComponent {
  constructor(
    public readonly loadingService: LoadingService,
    private readonly seo: SeoService
  ) {}

  ngOnInit() {
    this.handleSeo();
  }

  private handleSeo() {
    this.seo.updateTitle('starsbit - Home');
    this.seo.updateDescription('The personal website of starsbit.');
    this.seo.updateKeywords(
      'starsbit, stars, portfolio, projects, blog, software development'
    );
    this.seo.updateAuthor('stars');
    this.seo.updateOgUrl('https://starsbit.space');
    this.seo.updateOgTitle('starsbit - Home');
    this.seo.updateOgDescription('The personal website of starsbit.');
    this.seo.updateOgImage(
      'https://starsbit.space/assets/images/starsbit_logo_transparent_white.png'
    );
  }
}
