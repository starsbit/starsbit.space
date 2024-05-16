import { Component } from '@angular/core';

@Component({
  selector: 'stars-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  copyrightYear = new Date().getFullYear();
}
