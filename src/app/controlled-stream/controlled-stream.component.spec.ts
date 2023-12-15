import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlledStreamComponent } from './controlled-stream.component';

describe('ControlledStreamComponent', () => {
  let component: ControlledStreamComponent;
  let fixture: ComponentFixture<ControlledStreamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlledStreamComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ControlledStreamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
