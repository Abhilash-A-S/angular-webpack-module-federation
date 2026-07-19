import { loadRemoteModule } from '@angular-architects/module-federation';
import {
  Component,
  EnvironmentInjector,
  Input,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

@Component({
  selector: 'app-remote-loader',
  imports: [],
  template: `<ng-container #container></ng-container>`,
})
export class RemoteLoaderComponent {
  @Input({ required: true })
  remoteEntry!: string;

  @Input({ required: true })
  exposedModule!: string;

  @Input({ required: true })
  exportName!: string;

  @ViewChild('container', {
    read: ViewContainerRef,
    static: true,
  })
  container!: ViewContainerRef;

  constructor(private environmentInjector: EnvironmentInjector) {}

  async ngAfterViewInit() {
    await this.loadRemote();
  }

  private async loadRemote() {
    try {
      this.container.clear();
      debugger
      const remote = await loadRemoteModule({
        type: 'module',
        remoteEntry: this.remoteEntry,
        exposedModule: this.exposedModule,
      });
      debugger
      const component = remote[this.exportName];

      if (!component) {
        throw new Error(`Export '${this.exportName}' was not found.`);
      }

      this.container.createComponent(component, {
        environmentInjector: this.environmentInjector,
      });
    } catch (err) {
      console.error(err);

      this.container.clear();
    }
  }
}
