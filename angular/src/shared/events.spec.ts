import { EventEmitter } from './events';

describe('Events', () => {
  beforeEach(() => {});

  it('Events should be subscribeable and callable', async () => {
    var events = new EventEmitter();

    var event1 = (...args: any[]) => {
      console.log('event1', args);
    };

    events.on('event1', event1);
    events.emit('event1', 1);
    events.emit('event1', 2);

    events.removeListener('event1', event1);

    events.emit('event1', 3);
  });
});
