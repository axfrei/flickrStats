// src/app/container.ts

import PhotoService from '../service/photoService';
import SuggestionEngineService from '../service/suggestionEngineService';
import { photoCommentsCache, photoStatusCache, photoContextCache } from '../service/photoServiceCaches';

export class AppContainer {
  static getPhotoService(): PhotoService {
    const suggestionEngine = new SuggestionEngineService(photoStatusCache);
    return new PhotoService(suggestionEngine, photoCommentsCache, photoContextCache);
  }
}
