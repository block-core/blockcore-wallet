import { finished } from 'stream';
import { TaskRunner, TaskRunnerOptions } from './task-runner';

describe('TaskRunnerTests', () => {
  beforeEach(() => {});

  it('should be ok', () => {
    expect(true).toBeTrue();
  });

  // THESE TEST WORKS, THEY ARE JUST ASYNC AND NOT VALIDATED. UNCOMMENT AND MANUALLY VALIDATE WITH CONSOLE =)

  // it('Never stop running task', async () => {
  //     const tasks = new TaskRunner();

  //     const options: TaskRunnerOptions = {
  //         exponentialDelay: true,
  //         maximumWait: 1000 * 60, // one minute
  //         cancel: false,
  //         times: undefined,
  //         wait: 4 // This makes the calls: immediate, 8ms, 32ms, 256ms, 4096ms, 60000ms (maximum wait).
  //     };

  //     tasks.schedule(() => {
  //         console.log('I was executed!');
  //     }, options);
  // });

  // it('Stop Running Task after fixed times', async () => {

  //     const tasks = new TaskRunner();

  //     const options: TaskRunnerOptions = {
  //         exponentialDelay: true,
  //         maximumWait: 1000 * 60, // one minute
  //         cancel: false,
  //         times: 10,
  //         wait: 10 // Only wait 10 ms, this makes the calls: immediate, 20ms, 80ms, 640ms, 10240ms, 60000ms (maximum wait).
  //     };

  //     tasks.scheduleUntilStopped(() => {
  //         console.log('I was executed!');
  //     }, options);
  // });

  // it('Stop Running Task', async () => {
  //     const tasks = new TaskRunner();

  //     const options: TaskRunnerOptions = {
  //         exponentialDelay: true,
  //         maximumWait: 1000 * 60, // one minute
  //         cancel: false,
  //         times: 10,
  //         wait: 10, // Only wait 10 ms, this makes the calls: immediate, 20ms, 80ms, 640ms, 10240ms, 60000ms (maximum wait).
  //         finished: () => { console.log('FINISHED!!'); }
  //     };

  //     const state = tasks.schedule(() => {
  //         console.log('I was executed!');

  //     }, options);

  //     setTimeout(() => {
  //         // options.cancel = true;
  //         tasks.stop(state, options);

  //     }, 3000);
  // });
});
