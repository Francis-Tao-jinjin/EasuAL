export function isUndef(val) {
  return typeof val === "undefined";
}

export function isDefined(val) {
  return !isUndef(val);
}

export function isFunction(val) {
  return typeof val === "function";
}

export function isNumber(arg) {
  return (typeof arg === "number");
}

export function isString(arg) {
  return (typeof arg === 'string');
}