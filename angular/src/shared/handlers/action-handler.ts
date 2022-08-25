import { ActionMessage, Permission, RequestArguments } from '../interfaces';

export interface ActionHandler {
  action: string[];

  /** Called to prepare the data provided to user for approval, or automatic processing if permission given. */
  prepare(args: RequestArguments): any;

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
  message: ActionMessage;
}