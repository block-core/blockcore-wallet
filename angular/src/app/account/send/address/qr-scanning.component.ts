import { ThisReceiver } from '@angular/compiler';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { CameraDevice } from 'html5-qrcode/esm/core';
import { UIState } from 'src/app/services';

export interface DialogData {
  address: string;
}

@Component({
  selector: 'qr-scanning-dialog',
  templateUrl: 'qr-scanning.component.html',
  styleUrls: ['./qr-scanning.component.css'],
})
export class QrScanDialog implements OnInit {
  private html5QrCode: Html5Qrcode;
  public error: string;
  private cameras: Array<CameraDevice>;
  public label: string;
  public cameraIndex = -1;
  private config: any;

  constructor(private uiState: UIState, public dialogRef: MatDialogRef<QrScanDialog>, @Inject(MAT_DIALOG_DATA) public data: DialogData, public translate: TranslateService) {
    this.dialogRef.afterClosed().subscribe(() => {
      // Make sure we call stop when dialog is closed.
      if (this.html5QrCode) {
        this.html5QrCode.stop();
      }
    });
  }

  async ngOnInit() {
    this.config = {
      fps: 10,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    };

    this.html5QrCode = new Html5Qrcode('reader', this.config);

    await this.requestCameras();

    if (this.cameras.length > 0) {
      if (this.uiState.cameraId) {
        this.cameraIndex = this.cameras.findIndex((c) => c.id == this.uiState.cameraId);
      } else {
        // Start with the last camera first.
        this.cameraIndex = this.cameras.length - 1;
      }

      await this.startCamera(this.cameras[this.cameraIndex].id);
    }
  }

  toggleFlash() {
    // TODO: https://github.com/mebjas/html5-qrcode/issues/129
  }

  openFile() {
    // TODO: Add support for picking a file UI and provide that to the library like below:
    // this.html5QrCode.scanFileV2()
  }

  async requestCameras() {
    try {
      this.cameras = await Html5Qrcode.getCameras();
      console.log(this.cameras);
    } catch (err) {
      this.error = await this.translate.get('Account.UnableToGetCameras').toPromise();
    }
  }

  async startCamera(cameraId: string) {
    try {
      // Attempt to stop when not initial load
      try {
        await this.html5QrCode.stop();
      } catch (err) {
        console.error('Failed to stop:', err);
      }

      await this.html5QrCode.start(
        cameraId,
        this.config,
        (decodedText, decodedResult) => {
          this.onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          //   this.onScanFailure(errorMessage);
        }
      );

      this.uiState.cameraId = cameraId;
      await this.uiState.save();
    } catch (err) {
      this.onScanFailure(err);
    }
  }

  async changeCamera() {
    // Perform an request cameras every time user clicks the change camera button, if there are no cameras.
    if (!this.cameras && this.cameras.length == 0) {
      await this.requestCameras();
    }

    if (!this.cameras && this.cameras.length == 0) {
      return;
    }

    this.cameraIndex += 1;

    if (this.cameraIndex >= this.cameras.length) {
      this.cameraIndex = 0;
    }

    this.startCamera(this.cameras[this.cameraIndex].id);
  }

  onScanSuccess(decodedText: any, decodedResult: any) {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    this.data.address = decodedText;
    this.dialogRef.close(this.data.address);
  }

  onScanFailure(error: any) {
    console.warn(`Code scan error = ${error}`);
    this.error = error;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
