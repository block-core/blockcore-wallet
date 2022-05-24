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

    /** Callback function when the run has completed (or been cancelled). */
    finished?: Function;
}

interface TaskRunnerState {
    /** Number of times left of execution, will move down to 0 then stop. */
    times: number;

    /** The calculated wait time based upon the options. */
    wait: number;

    /** The total number of executions. */
    executions?: number;

    logs: string[];

    timeoutRef?: any;
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
    constructor() {

    }

    stop(state: TaskRunnerState, options: TaskRunnerOptions) {
        state.logs.push('Execution was stopped.');

        // Make we mark it as cancelled.
        options.cancel = true;

        // If there is a reference to the timeout, remove it.
        if (state.timeoutRef) {
            globalThis.clearTimeout(state.timeoutRef);
        }

        // Raise the finished event if defined.
        options.finished?.call(null);

        // Log the final results to console.
        console.log(JSON.stringify(state));
    }

    schedule(func: Function, options: TaskRunnerOptions): TaskRunnerState {
        let state: TaskRunnerState = {
            times: options.times,
            wait: options.wait,
            executions: 0,
            logs: []
        };

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

        return state;
    }

    interval(func: Function, options: TaskRunnerOptions, state: TaskRunnerState) {
        var interv = function (options, state) {
            return () => {
                if (typeof state.times === "undefined" || state.times-- > 0) {

                    if (options.cancel) {
                        state.logs.push('Execution was cancelled.');

                        // Log the final results to console.
                        console.log(JSON.stringify(state));

                        options.finished?.call(null);

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
                    state.timeoutRef = globalThis.setTimeout(interv, state.wait);

                    try {
                        func.call(null);
                    }
                    catch (e) {
                        if (options.stopOnError) {
                            options.times = 0;
                        }

                        state.logs.push(e.toString());
                        console.error(e);

                        // TODO: Figure out what this throw results in...
                        throw e.toString();
                    }
                } else {
                    state.logs.push('Execution was completed.');

                    // Log the final results to console.
                    console.log(JSON.stringify(state));

                    options.finished?.call(null);
                }
            };
        }(options, state);

        // Execute the first run immediately.
        state.timeoutRef = globalThis.setTimeout(interv, 0);
    };
}