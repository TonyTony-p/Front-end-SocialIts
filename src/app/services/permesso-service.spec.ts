import { TestBed } from '@angular/core/testing';

import { PermessoService } from './permesso-service';

describe('PermessoService', () => {
  let service: PermessoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermessoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
