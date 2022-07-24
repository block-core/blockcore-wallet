import { RequestArguments } from '../interfaces';

export interface ActionHandler {
  action: string[];
  // execute(args: RequestArguments): Promise<unknown>;
  execute(args: RequestArguments): unknown;
}
