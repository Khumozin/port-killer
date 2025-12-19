import { TestBed } from '@angular/core/testing';
import { VersionService } from './version.service';

describe('VersionService', () => {
  let service: VersionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VersionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a version', () => {
    expect(service.version()).toBeTruthy();
    expect(typeof service.version()).toBe('string');
  });

  it('should match semantic versioning pattern', () => {
    const version = service.version();
    expect(version).toMatch(/^\d+\.\d+\.\d+(-.*)?$/);
  });

  it('should expose version via getVersion method', () => {
    expect(service.getVersion()).toBe(service.version());
  });
});
