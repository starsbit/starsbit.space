import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoadingComponent } from '../../components/loading/loading.component';
import { HomeComponent } from './components/home/home.component';

@Component({
  selector: 'stars-defered-home',
  standalone: true,
  imports: [HomeComponent, LoadingComponent],
  templateUrl: './defered-home.component.html',
  styleUrl: './defered-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeferedHomeComponent {}
