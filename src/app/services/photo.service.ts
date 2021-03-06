import { Injectable } from '@angular/core';

import {
  Plugins,
  Capacitor,
  CameraPhoto,
  CameraSource,
  CameraResultType,
  FilesystemDirectory,
} from '@capacitor/core'
import { Platform } from '@ionic/angular';

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
  private isHybridPlatform: boolean;

  constructor(private platform: Platform) {
    this.isHybridPlatform = this.platform.is('hybrid');
  }

  public async loadSaved() {
    // * get photos array from storage
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || [];

    // WEB
    if (!this.isHybridPlatform) {
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

    // HYBRID
    if (this.isHybridPlatform) {
      return {
        filePath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri)
      };
    }

    // WEB
    if (!this.isHybridPlatform) {
      return {
        filePath: fileName,
        webviewPath: cameraPhoto.webPath
      };
    }
  }

  public async deletePicture(photo: Photo, position: number) {
    // * remove selected photo
    this.photos.splice(position, 1);
  
    // * update storage photos
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
  
    // * get file name
    const index = photo.filePath.lastIndexOf('/');
    const fileName = photo.filePath.substr(index + 1);

    // * remove from filesystem
    await Filesystem.deleteFile({
      path: fileName,
      directory: FilesystemDirectory.Data
    });
  }

  // ########## UTILS ##########

  private async readAsBase64(cameraPhoto: CameraPhoto): Promise<string> {
    // * fetch photo, read as blob, convert to base64
    
    // HYBRID
    if (this.isHybridPlatform) {
      const file = await Filesystem
        .readFile({ path: cameraPhoto.path });
      return file.data;
    }

    // WEB
    if (!this.isHybridPlatform) {
      const response = await fetch(cameraPhoto.webPath!);
      const blob = await response.blob();
      return await this.convertBlobToBase64(blob) as string;
    }
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