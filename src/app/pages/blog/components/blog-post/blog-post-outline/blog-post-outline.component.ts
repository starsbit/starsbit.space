import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'stars-blog-post-outline',
  standalone: true,
  imports: [NgClass, RouterLink],
  templateUrl: './blog-post-outline.component.html',
  styleUrl: './blog-post-outline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostOutlineComponent implements OnChanges {
  @Input() childComponent: MarkdownComponent;
  @Input() isContentRendered = false;
  headings: Array<{ id: string; text: string; tagName: string }> = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        const element = document.querySelector(`#${fragment}`);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Check if isContentRendered has changed and if it's true
    if (
      changes['isContentRendered'] &&
      changes['isContentRendered'].currentValue
    ) {
      this.scanHeadings();
    }
  }

  scanHeadings() {
    const headings = this.childComponent.element.nativeElement.querySelectorAll(
      'h1, h2, h3, h4, h5, h6'
    );

    this.headings = Array.from(headings)
      .filter((heading) => heading.textContent)
      .map((heading, index) => {
        // Check if the heading has an ID, if not, generate one
        if (!heading.id) {
          // Generate a unique ID using the heading's text content and its index
          // Replace spaces with dashes and make it lowercase to form a more standard ID format
          const generatedId = `${heading
            .textContent!.trim()
            .toLowerCase()
            .replace(/\s+/g, '-')}-${index}`;
          heading.id = generatedId;
        }

        const id = heading.id;
        const text = heading.textContent || '';
        const tagName = heading.tagName;

        return { id, text, tagName };
      });

    // Navigate to the fragment if it exists
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        const element = document.querySelector(`#${fragment}`);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}
