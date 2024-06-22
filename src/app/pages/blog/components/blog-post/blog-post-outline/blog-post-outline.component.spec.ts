import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlogPostOutlineComponent } from './blog-post-outline.component';

describe('BlogPostOutlineComponent', () => {
  let component: BlogPostOutlineComponent;
  let fixture: ComponentFixture<BlogPostOutlineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogPostOutlineComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BlogPostOutlineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
