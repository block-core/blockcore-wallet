import { ActionMessage, ActionPrepareResult, ActionRequest, ActionResponse, Permission } from '../interfaces';

export interface ActionHandler {
  action: string[];

  /** Called to prepare the data provided to user for approval, or automatic processing if permission given. */
  prepare(state: ActionState): Promise<ActionPrepareResult>;

  execute(state: ActionState, permission: Permission): Promise<ActionResponse>;
}

// export class ActionStateHolder {
//   static prompts: ActionState[] = [];
// }

export class ActionState {
  handler: ActionHandler;
  id: string;
  id2: string;
  method: string;
  content: object | string;
  prompt: any;
  promptPermission: any;
  windowId: number | undefined;
  message: ActionMessage;
}
