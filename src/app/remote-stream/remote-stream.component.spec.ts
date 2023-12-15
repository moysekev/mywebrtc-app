import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoteStreamComponent } from './remote-stream.component';

describe('RemoteStreamComponent', () => {
  let component: RemoteStreamComponent;
  let fixture: ComponentFixture<RemoteStreamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [RemoteStreamComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RemoteStreamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
