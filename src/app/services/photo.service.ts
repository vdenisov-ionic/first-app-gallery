import { Injectable } from '@angular/core';

import {
  Plugins,
  Capacitor,
  CameraPhoto,
  CameraSource,
  CameraResultType,
  FilesystemDirectory,
} from '@capacitor/core'

const { Camera, Filesystem, Storage } = Plugins;

export interface Photo {
  filepath: string;
  webviewPath: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: Photo[] = [];

  constructor() { }

  public async addNewToGallery() {
    // * take new photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    // * add to array
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);
  }

  private async savePicture(cameraPhoto: CameraPhoto): Promise<Photo> {
    // * generate name and data for file
    const fileName = new Date().getTime() + '.jpeg';
    const base64Data = await this.readAsBase64(cameraPhoto);

    // * save file via Filesystem API
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data
    });

    // * return object with metadata
    return {
      filepath: fileName,
      webviewPath: cameraPhoto.webPath
    };
  }

  private async readAsBase64(cameraPhoto: CameraPhoto): Promise<string> {
    // * fetch photo, read as blob, convert to base64
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = reject;
      reader.onload = () => resolve(reader.result as string);

      reader.readAsDataURL(blob);
    });
  }
}