import { TestBed } from '@angular/core/testing';

import { RuoloService } from './ruolo-service';

describe('RuoloService', () => {
  let service: RuoloService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RuoloService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
