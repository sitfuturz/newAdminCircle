import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComplainComponent } from './complain.component';

describe('ComplainComponent', () => {
  let component: ComplainComponent;
  let fixture: ComponentFixture<ComplainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComplainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComplainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
