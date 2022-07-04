import { ThisReceiver } from '@angular/compiler';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Html5Qrcode, Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
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
  private html5QrcodeScanner: Html5QrcodeScanner;
  public error: string;
  private cameras: Array<CameraDevice>;
  public label: string;

  constructor(public dialogRef: MatDialogRef<QrScanDialog>, @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  async ngOnInit() {
    let config: any = {
      fps: 10,
      qrbox: {
        width: 250,
        height: 250,
      },
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    };

    this.html5QrcodeScanner = new Html5QrcodeScanner('reader', config, /* verbose= */ false);

    this.html5QrcodeScanner.render(
      (decodedText: any, decodedResult: any) => {
        this.onScanSuccess(decodedText, decodedResult);
      },
      (error) => {
        this.onScanFailure(error);
      }
    );

    await this.requestCameras();
    this.changeCamera();
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
    const html5QrCode = new Html5Qrcode('reader');
    html5QrCode
      .start(
        cameraId,
        {
          fps: 10, // Optional, frame per seconds for qr code scanning
          qrbox: { width: 250, height: 250 }, // Optional, if you want bounded box UI
        },
        (decodedText, decodedResult) => {
          this.onScanSuccess(decodedText, decodedResult);
        },
        (errorMessage) => {
          //   this.onScanFailure(errorMessage);
        }
      )
      .catch((err) => {
        this.onScanFailure(err);
      });
  }

  public cameraIndex = -1;
  public camera: CameraDevice;

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

    console.log(this.cameraIndex);

    this.camera = this.cameras[this.cameraIndex];

    console.log('camera:', this.camera);

    this.startCamera(this.camera.id);

    // This method will trigger user permissions
    // this.html5QrcodeScanner
    //   .getCameras()
    //   .then((devices) => {
    //     /**
    //      * devices would be an array of objects of type:
    //      * { id: "id", label: "label" }
    //      */
    //     if (devices && devices.length) {
    //       var cameraId = devices[0].id;
    //       // .. use this to start scanning.
    //     }
    //   })
    //   .catch((err) => {
    //     // handle err
    //   });
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
