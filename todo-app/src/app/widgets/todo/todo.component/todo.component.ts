import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../../models/task.model';
import { IndexedDBService } from '../../../services/idb.service';

@Component({
  selector: 'app-todo-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.scss',
})
export class TodoWidgetComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];

  newTaskTitle: string = '';
  newTaskDate: string = '';
  newTaskTime: string = '';
  newTaskCritical: boolean = false;

  minDateString: string = '';
  minTimeString: string = '';
  currentTimeString: string = '';
  currentDateString: string = '';

  constructor(private idbService: IndexedDBService) {}

  private handleClockTick = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail) {
      const { time, date } = customEvent.detail;
      this.currentTimeString = time;
      this.currentDateString = date;

      this.updateMinGuards();
      this.evaluateDueTasks();
    }
  };

  async ngOnInit() {
    this.initDates();
    await this.loadTasks();
    window.addEventListener('taskflow:clock-tick', this.handleClockTick);

    const dueTask = this.tasks.find(t => !t.completed && t.isDue);
    if (dueTask) {
      this.dispatchTaskAlert(dueTask);
    }
  }

  ngOnDestroy() {
    window.removeEventListener('taskflow:clock-tick', this.handleClockTick);
  }

  get activeCount(): number {
    return this.tasks.filter(t => !t.completed).length;
  }

  get criticalCount(): number {
    return this.tasks.filter(t => !t.completed && t.critical).length;
  }

  initDates() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    this.minDateString = `${year}-${month}-${day}`;
    this.currentDateString = this.minDateString;
    this.currentTimeString = `${hours}:${minutes}`;

    this.newTaskDate = this.minDateString;
    this.newTaskTime = `${hours}:${minutes}`;

    this.updateMinGuards();
  }

  onDateChange() {
    this.updateMinGuards();
  }

  updateMinGuards() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentHM = `${hours}:${minutes}`;

    if (this.newTaskDate === this.minDateString) {
      this.minTimeString = currentHM;
      if (this.newTaskTime && this.newTaskTime < this.minTimeString) {
        this.newTaskTime = this.minTimeString;
      }
    } else {
      this.minTimeString = '';
    }
  }

  async addTask() {
    if (!this.newTaskTitle.trim()) return;

    if (this.newTaskDate < this.minDateString) {
      alert('Cannot create tasks for past dates.');
      return;
    }

    if (this.newTaskDate === this.minDateString && this.minTimeString && this.newTaskTime < this.minTimeString) {
      alert('Time cannot be in the past for today.');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: this.newTaskTitle.trim(),
      dueDate: this.newTaskDate || this.minDateString,
      dueTime: this.newTaskTime || '12:00',
      completed: false,
      critical: this.newTaskCritical,
      isDue: false
    };

    this.tasks.push(newTask);
    await this.idbService.put<Task>('tasks', newTask);

    this.dispatchStateMutation('CREATED', newTask.title, 'Assigned by Alistair Smith');

    this.newTaskTitle = '';
    this.newTaskCritical = false;
  }

  async toggleTaskComplete(task: Task) {
    task.completed = !task.completed;
    if (task.completed) {
      task.isDue = false;
    }
    await this.idbService.put<Task>('tasks', task);

    const action = task.completed ? 'COMPLETED' : 'UNCOMPLETED';
    const details = task.completed ? 'Marked Complete by Alistair Smith' : 'Reopened';
    this.dispatchStateMutation(action, task.title, details);
  }

  async toggleTaskCritical(task: Task) {
    task.critical = !task.critical;
    await this.idbService.put<Task>('tasks', task);
  }

  toggleNewTaskCritical() {
    this.newTaskCritical = !this.newTaskCritical;
  }

  async rescheduleTask(task: Task) {
    const [hStr, mStr] = task.dueTime.split(':');
    let h = parseInt(hStr, 10);
    let m = parseInt(mStr, 10) + 5;

    if (m >= 60) {
      m -= 60;
      h = (h + 1) % 24;
    }

    const newH = String(h).padStart(2, '0');
    const newM = String(m).padStart(2, '0');
    task.dueTime = `${newH}:${newM}`;
    task.isDue = false;

    await this.idbService.put<Task>('tasks', task);
    this.dispatchStateMutation('RESCHEDULED', task.title, 'Rescheduled +5m');
  }

  async deleteTask(task: Task) {
    this.tasks = this.tasks.filter(t => t.id !== task.id);
    await this.idbService.delete('tasks', task.id);
  }

  private evaluateDueTasks() {
    let stateChanged = false;

    this.tasks.forEach(t => {
      if (!t.completed) {
        const taskDateTime = `${t.dueDate} ${t.dueTime}`;
        const currentDateTime = `${this.currentDateString} ${this.currentTimeString}`;

        if (taskDateTime <= currentDateTime && !t.isDue) {
          t.isDue = true;
          stateChanged = true;
          this.dispatchTaskAlert(t);
        }
      }
    });

    if (stateChanged) {
      this.idbService.putAll<Task>('tasks', this.tasks);
    }
  }

  private dispatchTaskAlert(task: Task) {
    const event = new CustomEvent('taskflow:task-alert', {
      detail: {
        taskId: task.id,
        title: task.title,
        dueTime: task.dueTime
      }
    });
    window.dispatchEvent(event);
  }

  private dispatchStateMutation(action: string, taskTitle: string, details?: string) {
    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const event = new CustomEvent('taskflow:state-mutation', {
      detail: {
        action,
        taskTitle,
        timestamp,
        details
      }
    });
    window.dispatchEvent(event);
  }

  private async loadTasks() {
    try {
      this.tasks = await this.idbService.getAll<Task>('tasks');
    } catch (e) {
      console.error('Failed to load tasks from IndexedDB', e);
      this.tasks = [];
    }
  }
}
