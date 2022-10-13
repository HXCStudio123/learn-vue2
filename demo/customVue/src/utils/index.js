export * from './next-tick'
export const def = function (obj, key, value) {
  Object.defineProperty(obj, key, {
    enumerable: false,
    value,
  });
};
