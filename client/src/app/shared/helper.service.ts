import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelperService {

  formatDateTimeWithTimezone(dateTimeLocal: string): string {
    const date = new Date(dateTimeLocal);
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
    const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');
    
    return date.getFullYear() + '-' +
           (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
           date.getDate().toString().padStart(2, '0') + 'T' +
           date.getHours().toString().padStart(2, '0') + ':' +
           date.getMinutes().toString().padStart(2, '0') + 
           sign + hours + ':' + minutes;
  }
}