import { v4 as uuidv4 } from "uuid";
import { uid } from "uid";

export * as envs from "./env";
export { toSlug } from "./toSlug";
export * from "./utils";

export function uuidV4(): string {
  return uuidv4();
}

export function makeId(n = 16) {
  return uid(n);
}

export function formatTime(): string {
  return new Date().toString();
}
