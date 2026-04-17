import { TestBed } from '@angular/core/testing';

import { GruppoService } from './gruppo-service';

describe('GruppoService', () => {
  let service: GruppoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GruppoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
