const isNodejs =
  typeof global === "object" &&
  "[object global]" === global.toString.call(global);

const isBrowser =
  typeof window === "object" &&
  "[object Window]" === window.toString.call(window);

export { isNodejs, isBrowser };
