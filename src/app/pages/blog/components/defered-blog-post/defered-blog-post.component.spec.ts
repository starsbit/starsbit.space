import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeferedBlogPostComponent } from './defered-blog-post.component';

describe('DeferedBlogPostComponent', () => {
  let component: DeferedBlogPostComponent;
  let fixture: ComponentFixture<DeferedBlogPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeferedBlogPostComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeferedBlogPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
