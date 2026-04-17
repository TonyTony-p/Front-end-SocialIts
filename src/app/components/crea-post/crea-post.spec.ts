import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CreatePostComponent } from './crea-post';
import { PostService } from '../../services/post-service';


describe('CreatePostComponent', () => {
  let component: CreatePostComponent;
  let fixture: ComponentFixture<CreatePostComponent>;

  beforeEach(async () => {
    const postServiceSpy = jasmine.createSpyObj('PostService', ['creaPost']);

    await TestBed.configureTestingModule({
      declarations: [CreatePostComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: PostService, useValue: postServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have invalid form initially', () => {
    expect(component.postForm.valid).toBeFalse();
  });

  it('should validate required field', () => {
    const contenuto = component.postForm.controls['contenuto'];
    expect(contenuto.valid).toBeFalse();
    
    contenuto.setValue('Test content');
    expect(contenuto.valid).toBeTrue();
  });
});