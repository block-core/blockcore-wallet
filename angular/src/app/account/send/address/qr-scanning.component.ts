import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";

export interface DialogData {
    address: string;
}

@Component({
    selector: 'qr-scanning-dialog',
    templateUrl: 'qr-scanning.component.html',
    styleUrls: ['./qr-scanning.component.css']
})
export class QrScanDialog implements OnInit {
    constructor(
        public dialogRef: MatDialogRef<QrScanDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
    ) {

    }

    async ngOnInit() {
        let config: any = {
            fps: 10,
            qrbox: {
                width: 250, height: 250
            },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        };

        let html5QrcodeScanner = new Html5QrcodeScanner("reader", config, /* verbose= */ false);

        html5QrcodeScanner.render((decodedText: any, decodedResult: any) => {
            this.onScanSuccess(decodedText, decodedResult);
        }, (error) => {
            this.onScanFailure(error);
        });
    }

    onScanSuccess(decodedText: any, decodedResult: any) {
        console.log(`Code matched = ${decodedText}`, decodedResult);
        this.data.address = decodedText;
    }

    onScanFailure(error: any) {
        console.warn(`Code scan error = ${error}`);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}