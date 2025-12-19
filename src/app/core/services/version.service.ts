import { Injectable, signal } from '@angular/core';
import packageJson from '../../../../package.json';

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  /**
   * Application version from package.json
   */
  readonly version = signal<string>(packageJson.version);

  /**
   * Get the current version as a string
   */
  getVersion(): string {
    return this.version();
  }
}
