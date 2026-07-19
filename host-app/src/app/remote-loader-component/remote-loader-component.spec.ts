import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemoteLoaderComponent } from './remote-loader-component';

describe('RemoteLoaderComponent', () => {
  let component: RemoteLoaderComponent;
  let fixture: ComponentFixture<RemoteLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemoteLoaderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemoteLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
