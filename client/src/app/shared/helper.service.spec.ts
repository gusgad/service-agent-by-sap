import { TestBed } from '@angular/core/testing';
import { HelperService } from './helper.service';

describe('HelperService', () => {
  let service: HelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('formatDateTimeWithTimezone', () => {
    it('should format datetime with positive timezone offset', () => {
      // Mock timezone offset to +120 minutes (UTC+2)
      spyOn(Date.prototype, 'getTimezoneOffset').and.returnValue(-120);
      
      const result = service.formatDateTimeWithTimezone('2024-01-15T14:30');
      
      expect(result).toBe('2024-01-15T14:30+02:00');
    });

    it('should format datetime with negative timezone offset', () => {
      // Mock timezone offset to -300 minutes (UTC-5)
      spyOn(Date.prototype, 'getTimezoneOffset').and.returnValue(300);
      
      const result = service.formatDateTimeWithTimezone('2024-01-15T14:30');
      
      expect(result).toBe('2024-01-15T14:30-05:00');
    });

    it('should format datetime with UTC timezone', () => {
      // Mock timezone offset to 0 minutes (UTC)
      spyOn(Date.prototype, 'getTimezoneOffset').and.returnValue(0);
      
      const result = service.formatDateTimeWithTimezone('2024-01-15T14:30');
      
      expect(result).toBe('2024-01-15T14:30+00:00');
    });

    it('should handle single digit months and days', () => {
      spyOn(Date.prototype, 'getTimezoneOffset').and.returnValue(-60);
      
      const result = service.formatDateTimeWithTimezone('2024-03-05T09:05');
      
      expect(result).toBe('2024-03-05T09:05+01:00');
    });
  });
});