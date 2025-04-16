import { Schema, model, connect } from 'mongoose';
import { IPhotoStatus } from '../types/photoStatus'
import logger, { Logger } from 'pino';

const MONGO_URI = `mongodb+srv://axelfreiria:${process.env.MONGO_PASS}@flickrsuggestapp.vhtqg.mongodb.net/?retryWrites=true&w=majority&appName=flickrSuggestApp`;
const logger_: Logger = logger();

export const connectToDb = () => connect(MONGO_URI)
  .then(() => {
    logger_.info('Connected to MongoDB');
  })
  .catch((error) => {
    logger_.error('Error connecting to MongoDB:', error);
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

