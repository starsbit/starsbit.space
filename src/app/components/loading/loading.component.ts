import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'stars-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
})
export class LoadingComponent implements OnInit {
  darkMode = false;

  constructor(
    public readonly themeService: ThemeService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.themeService.isDarkMode$.subscribe((isDark) => {
      this.darkMode = isDark;
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
      }
      this.cdr.detectChanges();
    });
  }

  get spinnerColor() {
    return this.darkMode ? 'white-spinner' : 'black-spinner';
  }
}
