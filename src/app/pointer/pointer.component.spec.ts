import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointerComponent } from './pointer.component';

describe('PointerComponent', () => {
  let component: PointerComponent;
  let fixture: ComponentFixture<PointerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PointerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PointerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
