import { ActionMessage, ActionRequest, Permission } from '../interfaces';

export interface ActionHandler {
  action: string[];

  /** Called to prepare the data provided to user for approval, or automatic processing if permission given. */
  prepare(args: ActionMessage): object;

  execute(args: ActionMessage, permission: Permission): unknown;
}

// export class ActionStateHolder {
//   static prompts: ActionState[] = [];
// }

export class ActionState {
  handler: ActionHandler;
  id: string;
  id2: string;
  method: string;
  content: object;
  prompt: any;
  promptPermission: any;
  windowId: number | undefined;
  message: ActionMessage;
}
