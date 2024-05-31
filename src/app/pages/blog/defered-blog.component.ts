import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoadingComponent } from '../../components/loading/loading.component';
import { LoadingService } from '../../services/loading.service';
import { BlogComponent } from './components/blog/blog.component';

@Component({
  selector: 'stars-defered-blog',
  standalone: true,
  imports: [BlogComponent, LoadingComponent, AsyncPipe],
  templateUrl: './defered-blog.component.html',
  styleUrl: './defered-blog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeferedBlogComponent {
  constructor(public readonly loadingService: LoadingService) {}
}
