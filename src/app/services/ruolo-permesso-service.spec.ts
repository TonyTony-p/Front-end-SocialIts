import { TestBed } from '@angular/core/testing';

import { RuoloPermessoService } from './ruolo-permesso-service';

describe('RuoloPermessoService', () => {
  let service: RuoloPermessoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RuoloPermessoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
