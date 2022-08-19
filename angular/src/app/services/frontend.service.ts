import { Injectable, OnInit } from '@angular/core';
import { BackgroundManager, ProcessResult } from 'src/shared/background-manager';
import { RunState } from 'src/shared/task-runner';
import { CommunicationService } from './communication.service';
import { EventBus } from './event-bus';

@Injectable({
  providedIn: 'root',
})
export class FrontendService implements OnInit {
  private backgroundManager: BackgroundManager;
  private watchManager: BackgroundManager | null;
  private networkUpdateInterval = 45000;
  private networkManager: BackgroundManager;
  private networkWatcherRef: any;
  private indexing: boolean;

  constructor(private events: EventBus, private communication: CommunicationService) {
    this.events.subscribeAll().subscribe(async (message) => {
      console.log('ALL EVENTS', message);
      //   this.ngZone.run(async () => {
      //     // Compared to the extension based messaging, we don't have response messages.
      //     // this.logger.debug(`Process message:`, message);
      //     await this.handleMessage(message.data);
      //   });

      if (message.key === 'index') {
        await this.executeIndexer();
      }
    });

    events.subscribe('activated').subscribe(async () => {
      console.log('ACTIVATED!!!');
      await this.networkStatusWatcher();
      await this.executeIndexer();
    });

    events.subscribe('keep-alive').subscribe(async () => {
      console.log('keep-alive!!!');
      //   await this.executeIndexer();
    });
  }

  ngOnInit(): void {}

  async networkStatusWatcher() {
    if (this.networkWatcherRef) {
      globalThis.clearTimeout(this.networkWatcherRef);
      this.networkWatcherRef = null;
    }

    if (this.networkManager == null) {
      this.networkManager = new BackgroundManager();
    }

    var interval = async () => {
      // We don't have the Angular environment information available in the service worker,
      // so we'll default to the default blockcore accounts, which should include those that
      // are default on CoinVault.
      await this.networkManager.updateNetworkStatus('blockcore');

      const msg = {
        type: 'network-updated',
        data: { source: 'network-status-watcher' },
        ext: 'blockcore',
        source: 'background',
        target: 'tabs',
        host: location.host,
      };

      this.communication.send(msg);

      // Continue running the watcher if it has not been cancelled.
      this.networkWatcherRef = globalThis.setTimeout(interval, this.networkUpdateInterval);
    };

    // First interval we'll wait for complete run.
    await interval();

    // networkWatcherRef = globalThis.setTimeout(async () => {
    //     await interval();
    // }, 0);
  }

  async executeIndexer() {
    // If we are already indexing, simply ignore this request.
    if (this.indexing) {
      console.log('Already indexing, skipping this indexing request.');
      return;
    }

    console.log('Starting indexing.....');

    this.indexing = true;
    await this.runIndexer();
    this.indexing = false;

    console.log('Finished! indexing.....');

    // When the indexer has finished, run watcher automatically.
    await this.runWatcher();
  }

  runIndexer = async () => {
    // Stop and ensure watcher doesn't start up while indexer is running.
    if (this.watchManager) {
      this.watchManager.onStopped = () => {};
      this.watchManager.stop();
      this.watchManager = null;
    }

    // Whenever indexer is executed, we'll create a new manager.
    let manager: any = new BackgroundManager();

    console.log('Created new manager object!!');

    manager.onUpdates = (status: ProcessResult) => {
      if (status.changes) {
        const msg = {
          type: 'indexed',
          data: { source: 'indexer-on-schedule' },
          ext: 'blockcore',
          source: 'background',
          target: 'tabs',
          host: location.host,
        };

        this.communication.send(msg);
      } else {
        const msg = {
          type: 'updated',
          data: { source: 'indexer-on-schedule' },
          ext: 'blockcore',
          source: 'background',
          target: 'tabs',
          host: location.host,
        };

        this.communication.send(msg);
      }
    };

    await manager.runIndexer();

    // Reset the manager after full indexer run.
    manager = null;
  };

  async runWatcher() {
    // If we are indexing, simply ignore all calls to runWatcher.
    if (this.indexing) {
      return;
    }
  
    // If there are multiple requests incoming to stop the watcher at the same time
    // they will all simply mark the watch manager to stop processing, which will
    // automatically start a new instance when finished.
    if (this.watchManager != null) {
      // First stop the existing watcher process.
      this.watchManager.stop();
      // console.log('Calling to stop watch manager...');
    } else {
        this.watchManager = new BackgroundManager();
  
      // Whenever the manager has successfully stopped, restart the watcher process.
      this.watchManager.onStopped = () => {
        // console.log('Watch Manager actually stopped, re-running!!');
        this.watchManager = null;
        this.runWatcher();
      };
  
      this.watchManager.onUpdates = (status: ProcessResult) => {
        if (status.changes) {
          const msg = {
            type: 'indexed',
            data: { source: 'watcher' },
            ext: 'blockcore',
            source: 'background',
            target: 'tabs',
            host: location.host,
          };

          this.communication.send(msg);
        } else {
          const msg = {
            type: 'updated',
            data: { source: 'watcher' },
            ext: 'blockcore',
            source: 'background',
            target: 'tabs',
            host: location.host,
          };

          this.communication.send(msg);
        }
      };
  
      let runState: RunState = {};
  
      await this.watchManager.runWatcher(runState);
    }
  };
}
