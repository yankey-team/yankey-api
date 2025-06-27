import { Schema } from "mongoose";

export const modifySchema = <T>(schema: Schema<T>): Schema<T> => {
  schema.set("toObject", {
    virtuals: true,
    versionKey: false,
    getters: false,
    transform: (doc, ret) => {
      const transformed = { ...ret };

      transformed.id = transformed._id.toString();
      delete transformed._id;
      delete transformed.__v;
      delete transformed.i;

      return transformed;
    },
  });
  return schema;
};