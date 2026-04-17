import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordResetRequest } from './password-reset-request';

describe('PasswordResetRequest', () => {
  let component: PasswordResetRequest;
  let fixture: ComponentFixture<PasswordResetRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordResetRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordResetRequest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
