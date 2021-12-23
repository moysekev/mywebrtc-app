import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocalStreamComponent } from './local-stream.component';

describe('LocalStreamComponent', () => {
  let component: LocalStreamComponent;
  let fixture: ComponentFixture<LocalStreamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LocalStreamComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LocalStreamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
