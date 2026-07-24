import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-clock-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clock.component.html',
  styleUrl: './clock.component.scss',
})
export class ClockWidgetComponent implements OnInit, OnDestroy {
  currentTime: string = '';
  currentDate: string = '';
  private timerId: any;

  ngOnInit() {
    this.updateClock();
    this.timerId = setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private updateClock() {
    const now = new Date();
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.currentTime = `${hours}:${minutes}:${seconds}`;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayName = days[now.getDay()];
    const dateNum = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    
    this.currentDate = `${dayName}, ${dateNum} ${monthName} ${year}`;

    const event = new CustomEvent('taskflow:clock-tick', {
      detail: {
        time: `${hours}:${minutes}`,
        fullTime: this.currentTime,
        date: `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(dateNum).padStart(2, '0')}`,
        timestamp: now.getTime()
      }
    });
    window.dispatchEvent(event);
  }
}
