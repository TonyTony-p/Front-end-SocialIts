import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home';

import { Router } from 'express';
import { of } from 'rxjs';
import { PostService } from '../../services/post-service';
import { AuthService } from '../../services/auth';

// Mock molto semplice
class MockAuthService {
  logout() {}
}

class MockPostService {
  getAllPosts() {
    return of([]);
  }
}

class MockRouter {
  navigate() {}
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: PostService, useClass: MockPostService },
        { provide: Router, useClass: MockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    expect(component.loading).toBeTrue();
    expect(component.posts).toEqual([]);
  });
});