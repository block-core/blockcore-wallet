import { Injectable } from "@angular/core";
import { NGXLoggerWriterService, INGXLoggerMetadata, INGXLoggerConfig, NgxLoggerLevel } from "ngx-logger";

@Injectable()
export class LogWriterService extends NGXLoggerWriterService {
    logs: INGXLoggerMetadata[] = [];
    errors: INGXLoggerMetadata[] = [];

    /** Write the content sent to the log function to the sessionStorage */
    public writeMessage(metadata: INGXLoggerMetadata, config: INGXLoggerConfig): void {
        super.writeMessage(metadata, config);

        // If the log has 100 items or more, clear 50 oldest.
        if (this.logs.length > 100) {
            this.resize(this.logs, 80, null);
        }

        if (this.errors.length > 100) {
            this.resize(this.errors, 80, null);
        }

        this.logs.push(metadata);

        // Keep a list of ERROR and FATAL messages.
        if (metadata.level > NgxLoggerLevel.WARN) {
            this.errors.push(metadata);
        }
    }

    resize(arr: any[], size: number, defval: any) {
        while (arr.length > size) { arr.shift(); }
        while (arr.length < size) { arr.push(defval); }
    }
}