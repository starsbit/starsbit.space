import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeferedBlogComponent } from './defered-blog.component';

describe('DeferedBlogComponent', () => {
  let component: DeferedBlogComponent;
  let fixture: ComponentFixture<DeferedBlogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeferedBlogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeferedBlogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
