/**
 * Type utilities for Mongoose document transformations
 * Provides type safety for toJSON and toObject transform functions
 */

import mongoose from 'mongoose';

/**
 * Type for the return value in Mongoose transform functions
 * Represents the serialized document after transformation
 */
export type MongooseTransformReturn = Record<string, unknown> & {
  _id?: mongoose.Types.ObjectId;
  __v?: number;
  id?: string;
};

/**
 * Type for the document parameter in Mongoose transform functions
 */
export type MongooseTransformDoc = mongoose.Document & {
  _id: mongoose.Types.ObjectId;
  __v?: number;
};

/**
 * Transform function signature for Mongoose schemas
 */
export type MongooseTransformFn = (
  _doc: MongooseTransformDoc,
  ret: MongooseTransformReturn
) => MongooseTransformReturn;
