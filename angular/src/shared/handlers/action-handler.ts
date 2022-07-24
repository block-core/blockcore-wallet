import { ActionMessageResponse, RequestArguments } from '../interfaces';

export interface ActionHandler {
  action: string[];

  // execute(args: RequestArguments): Promise<unknown>;
  execute(args: RequestArguments): unknown;
}

export class ActionState {
  handler: ActionHandler;
  id: string;
  method: string;
  prompt: any;
  windowId: number | undefined;
  message: ActionMessageResponse;
}