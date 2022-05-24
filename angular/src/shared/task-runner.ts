export interface TaskRunnerOptions {
    /** Set to true to cancel the runner. */
    cancel: boolean;

    /** The initial wait for exponential delay, or the fixed delay for regular interval runs. */
    wait: number;

    /** Set the maximum wait time that can happen after the exponential delay calculations. */
    maximumWait: number;

    /** Set to true to use exponential delay, or fixed delay will be used. */
    exponentialDelay: boolean;

    /** Set to a value to have a fixed number of executions. */
    times: number;

    /** Set to true to stop if there is any exception. If not set to true, processing will continue on errors. */
    stopOnError?: boolean;
}

interface TaskRunnerState {
    /** Number of times left of execution, will move down to 0 then stop. */
    times: number;

    /** The calculated wait time based upon the options. */
    wait: number;

    /** The total number of executions. */
    executions?: number;

    logs: string[];
}

/** Allows different types of scheduled tasks.
 * 
 * - Run everwhere, but incremental fallback.
 * - Run X number of times with fixed interval.
 * 
 * 
 * 
 */
export class TaskRunner {
    runs: any[] = [];

    constructor() {
        setInterval(() => {
            console.log('Task Runner Scheduled Status Logger:');
            console.log(JSON.stringify(this.runs));

            // Clear the runs after logging.
            this.runs = [];
        }, 10000);
    }

    schedule(func: Function, options: TaskRunnerOptions) {
        let state: TaskRunnerState = {
            times: options.times,
            wait: options.wait,
            executions: 0,
            logs: []
        };

        this.runs.push(state);

        this.interval(() => {
            const run = { runs: 0, logs: [] } as any;

            const t0 = performance.now();

            try {
                func();
            } catch (err) {
                run.lastError = err;
            }

            const t1 = performance.now();

            state.logs.push(`Execution of task took ${t1 - t0} milliseconds.`);

        }, options, state);
    }

    interval(func: Function, options: TaskRunnerOptions, state: TaskRunnerState) {
        var interv = function (options, state) {
            return () => {
                if (typeof state.times === "undefined" || state.times-- > 0) {

                    if (options.cancel) {
                        console.log('Execution was stopped.');
                        return;
                    }

                    // Increase the executions nummbers.
                    state.executions++;

                    if (options.exponentialDelay) {
                        state.wait = 2 ** state.executions * state.wait;
                    }

                    if (state.wait > options.maximumWait) {
                        state.wait = options.maximumWait;
                    }

                    state.logs.push(`Waiting for ${state.wait}ms, execution run #${state.executions}...`);

                    setTimeout(interv, state.wait);

                    try {
                        func.call(null);
                    }
                    catch (e) {
                        if (options.stopOnError) {
                            options.times = 0;
                        }

                        state.logs.push(e.toString());
                        console.error(e);
                        throw e.toString();
                    }
                }
            };
        }(options, state);

        // Execute the first run immediately.
        setTimeout(interv, 0);
    };
}