import {
  isNil, omit, pipe, prop, when,
} from 'ramda';
import { ObjectId } from 'mongodb';

export const docId = prop('_id');
export const modelId = prop('id');
export const castDocId = when(ObjectId.isValid, (id) => new ObjectId(id));
export const withoutId = omit(['_id']);
export const removeUndefinedId = when(pipe(docId, isNil), omit(['_id']));
