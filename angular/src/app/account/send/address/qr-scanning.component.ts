import { ThisReceiver } from '@angular/compiler';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { CameraDevice } from 'html5-qrcode/esm/core';

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
  public camera: CameraDevice;

  constructor(public dialogRef: MatDialogRef<QrScanDialog>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.dialogRef.afterClosed().subscribe(() => {
      // Make sure we call stop when dialog is closed.
      if (this.html5QrCode) {
        this.html5QrCode.stop();
      }
    });
  }

  private config: any;

  async ngOnInit() {
    this.config = {
      fps: 10,
      qrbox: {
        width: 400,
        height: 400,
        aspectRatio: 1.0,
      },
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    };

    this.html5QrCode = new Html5Qrcode('reader', this.config);

    await this.requestCameras();
    this.changeCamera();
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
      this.error = 'Unable to get cameras.';
    }
  }

  async startCamera(cameraId: string) {
    try {
      // Always stop before starting a new instance.
      try {
        await this.html5QrCode.stop();
      } catch (err) {
        console.error('Failed to stop:', err);
      }

      this.html5QrCode.start(
        cameraId,
        this.config,
        (decodedText, decodedResult) => {
          this.onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          //   this.onScanFailure(errorMessage);
        }
      );
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

    this.camera = this.cameras[this.cameraIndex];
    this.startCamera(this.camera.id);
  }

  onScanSuccess(decodedText: any, decodedResult: any) {
    console.log(`Code matched = ${decodedText}`, decodedResult);
    this.data.address = decodedText;
    this.dialogRef.close(this.data.address);
  }

  onScanFailure(error: any) {
    console.warn(`Code scan error = ${error}`);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
