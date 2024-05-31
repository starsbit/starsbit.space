import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GoogleAnalyticsTagComponent } from './components/google-analytics-tag/google-analytics-tag.component';
import { LoadingComponent } from './components/loading/loading.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingComponent, GoogleAnalyticsTagComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'starsbit';
}
