/**
 * Return a slugified copy of a string.
 * @description A slug is a string that is used to uniquely identify a resource in a URL-friendly way.
 * @param {string} str The string to be slugified
 * @return {string} The slugified string.
 */
export function toSlug(str: string): string {
  let s = str;
  if (!s) {
    return "";
  }
  s = s.toLowerCase().trim();
  s = s.replace(/ & /g, " and ");
  s = s.replace(/[ ]+/g, "-");
  s = s.replace(/[-]+/g, "-");
  s = s.replace(/[^a-z0-9-]+/g, "");
  return s;
}
