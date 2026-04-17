import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuovaPasswordComponent } from './nuova-password-component';

describe('NuovaPasswordComponent', () => {
  let component: NuovaPasswordComponent;
  let fixture: ComponentFixture<NuovaPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuovaPasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuovaPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
