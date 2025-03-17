import { Schema, model, connect } from 'mongoose';
import { IPhotoStatus } from './types/photoStatus'

const MONGO_URI = `mongodb+srv://axelfreiria:${process.env.MONGO_PASS}@flickrsuggestapp.vhtqg.mongodb.net/?retryWrites=true&w=majority&appName=flickrSuggestApp`;

export const connectToDb = () => connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
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

