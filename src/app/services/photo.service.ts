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
    this.photos.unshift({
      filepath: "soon...",
      webviewPath: capturedPhoto.webPath
    });
  }

}
