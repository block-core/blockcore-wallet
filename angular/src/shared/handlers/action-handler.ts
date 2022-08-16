import { ActionMessageResponse, Permission, RequestArguments } from '../interfaces';

export interface ActionHandler {
  action: string[];

  // execute(args: RequestArguments): Promise<unknown>;
  execute(permission: Permission, args: RequestArguments): unknown;
}

// export class ActionStateHolder {
//   static prompts: ActionState[] = [];
// }

export class ActionState {
  handler: ActionHandler;
  id: string;
  id2: string;
  method: string;
  prompt: any;
  promptPermission: any;
  windowId: number | undefined;
  message: ActionMessageResponse;
}