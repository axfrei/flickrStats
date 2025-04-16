import { Schema, model, connect } from 'mongoose';
import { IPhotoStatus } from '../types/photoStatus'
import {logger} from '../logger';

export const connectToDb = () => connect('mongodb+srv://flickrsuggestapp.vhtqg.mongodb.net/?retryWrites=true&w=majority&appName=flickrSuggestApp', { user: process.env.MONGO_USER, pass: process.env.MONGO_PASS})
  .then(() => {
    logger.info('Connected to MongoDB');
  })
  .catch((error) => {
    logger.error('Error connecting to MongoDB: %s', error.message);
  });


const photoStatusSchema = new Schema<IPhotoStatus>({
  _id: String,
  groups: {
    type: Object,
    patternProperties: {
      "^.*$": {
        type: Object,
        properties: {
          currentLevel: {
            type: Number
          }
        }
      }
    },
    additionalProperties: false
  }
});

export const PhotoStatus = model('PhotoStatus', photoStatusSchema)

