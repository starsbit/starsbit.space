import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeferedHomeComponent } from './defered-home.component';

describe('DeferedHomeComponent', () => {
  let component: DeferedHomeComponent;
  let fixture: ComponentFixture<DeferedHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeferedHomeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeferedHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
