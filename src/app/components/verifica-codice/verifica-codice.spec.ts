import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerificaCodiceComponent } from './verifica-codice';



describe('VerificaCodice', () => {
  let component: VerificaCodiceComponent;
  let fixture: ComponentFixture<VerificaCodiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificaCodiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerificaCodiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
