import { Injectable } from "@angular/core";
import { INGXLoggerMetadata } from "ngx-logger";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class DebugLogService {
    logs: INGXLoggerMetadata[] = [];
    errors: INGXLoggerMetadata[] = [];
}
