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
  filePath: string;
  webviewPath: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: Photo[] = [];
  private PHOTO_STORAGE: string = "photos";

  constructor() { }

  public async loadSaved() {
    // * get photos array from storage
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || [];

    for (let photo of this.photos) {
      // * read each photo from filesystem
      const readFile = await Filesystem.readFile({
        path: photo.filePath,
        directory: FilesystemDirectory.Data
      });
    
      // * generate view path for <img>
      photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
  }

  public async addNewToGallery() {
    // * take new photo from camera
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100
    });

    // * add new photo to array
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);

    // * save photos array to storage
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
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
      filePath: fileName,
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