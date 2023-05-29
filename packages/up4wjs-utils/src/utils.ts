import BN, { BigNumber } from "bignumber.js";
import utf8 from "utf8";
import {} from "@dioxide-js/misc";

/**
 * Returns true if object is BN, otherwise false
 *
 * @method isBN
 * @param {Object} object
 * @return {Boolean}
 */
const isBN = function (object: any) {
  return BN.isBigNumber(object);
};

/**
 * Takes an input and transforms it into an BN
 *
 * @method toBN
 * @param {Number|String|BN} number, string, HEX string or BN
 * @return {BN} BN
 */
const toBN = function (number: BN.Value) {
  try {
    return new BigNumber(number);
  } catch (e) {
    throw new Error(e + ' Given value: "' + number + '"');
  }
};

/**
 * Should be called to pad string to expected length
 *
 * @method leftPad
 * @param {String} string to be padded
 * @param {Number} chars that result string should have
 * @param {String} sign, by default 0
 * @returns {String} right aligned string
 */
const leftPad = function (
  string: number | string,
  chars: number,
  sign: string
) {
  let hasPrefix = /^0x/i.test(string + "") || typeof string === "number";
  string = string.toString(16).replace(/^0x/i, "");

  let padding = chars - string.length + 1 >= 0 ? chars - string.length + 1 : 0;

  return (
    (hasPrefix ? "0x" : "") +
    new Array(padding).join(sign ? sign : "0") +
    string
  );
};

/**
 * Should be called to pad string to expected length
 *
 * @method rightPad
 * @param {String} string to be padded
 * @param {Number} chars that result string should have
 * @param {String} sign, by default 0
 * @returns {String} right aligned string
 */
const rightPad = function (
  string: number | string,
  chars: number,
  sign: string
) {
  let hasPrefix = /^0x/i.test(string + "") || typeof string === "number";
  string = string.toString(16).replace(/^0x/i, "");

  var padding = chars - string.length + 1 >= 0 ? chars - string.length + 1 : 0;

  return (
    (hasPrefix ? "0x" : "") +
    string +
    new Array(padding).join(sign ? sign : "0")
  );
};

/**
 * Should be called to get hex representation (prefixed by 0x) of utf8 string
 *
 * @method utf8ToHex
 * @param {String} str
 * @returns {String} hex representation of input string
 */
const utf8ToHex = function (str: string) {
  str = utf8.encode(str);
  let hex = "";

  // remove \u0000 padding from either side
  str = str.replace(/^(?:\u0000)*/, "");
  str = str.split("").reverse().join("");
  str = str.replace(/^(?:\u0000)*/, "");
  str = str.split("").reverse().join("");

  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    // if (code !== 0) {
    let n = code.toString(16);
    hex += n.length < 2 ? "0" + n : n;
    // }
  }

  return "0x" + hex;
};

/**
 * Should be called to get utf8 from it's hex representation
 *
 * @method hexToUtf8
 * @param {String} hex
 * @returns {String} ascii string representation of hex value
 */
const hexToUtf8 = function (hex: string) {
  if (!isHexStrict(hex))
    throw new Error('The parameter "' + hex + '" must be a valid HEX string.');

  let str = "";
  let code = 0;
  hex = hex.replace(/^0x/i, "");

  // remove 00 padding from either side
  hex = hex.replace(/^(?:00)*/, "");
  hex = hex.split("").reverse().join("");
  hex = hex.replace(/^(?:00)*/, "");
  hex = hex.split("").reverse().join("");

  const l = hex.length;

  for (var i = 0; i < l; i += 2) {
    code = parseInt(hex.slice(i, i + 2), 16);
    // if (code !== 0) {
    str += String.fromCharCode(code);
    // }
  }

  return utf8.decode(str);
};

/**
 * Converts value to it's number representation
 *
 * @method hexToNumber
 * @param {String|Number|BN} value
 * @return {String}
 */
const hexToNumber = function (value: string) {
  if (!value) {
    return value;
  }

  if (typeof value === "string" && !isHexStrict(value)) {
    throw new Error('Given value "' + value + '" is not a valid hex string.');
  }

  return toBN(value).toNumber();
};

/**
 * Converts value to it's decimal representation in string
 *
 * @method hexToNumberString
 * @param {String|Number|BN} value
 * @return {String}
 */
const hexToNumberString = function (value: string) {
  if (!value) return value;

  if (typeof value === "string" && !isHexStrict(value)) {
    throw new Error('Given value "' + value + '" is not a valid hex string.');
  }

  return toBN(value).toString(10);
};

/**
 * Converts value to it's hex representation
 *
 * @method numberToHex
 * @param {String|Number|BN} value
 * @return {String}
 */
const numberToHex = function (value: number) {
  if (value === null || value === undefined) {
    return value;
  }

  if (!isFinite(value) && !isHexStrict(value)) {
    throw new Error('Given input "' + value + '" is not a number.');
  }

  const number = toBN(value);
  const result = number.toString(16);

  return number.lt(new BN(0)) ? "-0x" + result.slice(1) : "0x" + result;
};

/**
 * Convert a byte array to a hex string
 *
 * Note: Implementation from crypto-js
 *
 * @method bytesToHex
 * @param {Array} bytes
 * @return {String} the hex string
 */
const bytesToHex = function (bytes: number[]) {
  for (var hex = [], i = 0; i < bytes.length; i++) {
    /* jshint ignore:start */
    hex.push((bytes[i] >>> 4).toString(16));
    hex.push((bytes[i] & 0xf).toString(16));
    /* jshint ignore:end */
  }
  return "0x" + hex.join("");
};

/**
 * Convert a hex string to a byte array
 *
 * Note: Implementation from crypto-js
 *
 * @method hexToBytes
 * @param {string} hex
 * @return {Array} the byte array
 */
const hexToBytes = function (hex: number | string) {
  hex = hex.toString(16);

  if (!isHexStrict(hex)) {
    throw new Error('Given value "' + hex + '" is not a valid hex string.');
  }

  hex = hex.replace(/^0x/i, "");
  let bytes = [];
  for (let c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.slice(c, c + 2), 16));
  return bytes;
};

/**
 * Auto converts any given value into it's hex representation.
 *
 * And even stringifys objects before.
 *
 * @method toHex
 * @param {String|Number|BN|Object|Buffer} value
 * @param {Boolean} returnType
 * @return {String}
 */
const toHex = function (
  value: String | Number | BN | Object | Buffer,
  returnType: boolean
): string {
  if (typeof value === "boolean") {
    return returnType ? "bool" : value ? "0x01" : "0x00";
  }

  if (Buffer.isBuffer(value)) {
    return "0x" + value.toString("hex");
  }

  if (typeof value === "object" && !!value && !isBN(value) && !isBN(value)) {
    return returnType ? "string" : utf8ToHex(JSON.stringify(value));
  }

  // if its a negative number, pass it through numberToHex
  if (typeof value === "string") {
    if (value.indexOf("-0x") === 0 || value.indexOf("-0X") === 0) {
      return returnType ? "int256" : numberToHex(parseInt(value));
    } else if (value.indexOf("0x") === 0 || value.indexOf("0X") === 0) {
      return returnType ? "bytes" : value;
    } else if (!isFinite(+value)) {
      return returnType ? "string" : utf8ToHex(value);
    }
  }

  return returnType ? (value < 0 ? "int256" : "uint256") : numberToHex(+value);
};

/**
 * Check if string is HEX, requires a 0x in front
 *
 * @method isHexStrict
 * @param {String} hex to be checked
 * @returns {Boolean}
 */
const isHexStrict = function (hex: number | string) {
  return (
    (typeof hex === "string" || typeof hex === "number") &&
    /^(-)?0x[0-9a-f]*$/i.test(String(hex))
  );
};

/**
 * Check if string is HEX
 *
 * @method isHex
 * @param {String} hex to be checked
 * @returns {Boolean}
 */
const isHex = function (hex: string) {
  return (
    (typeof hex === "string" || typeof hex === "number") &&
    /^(-0x|0x)?[0-9a-f]*$/i.test(hex)
  );
};

/**
 * Remove 0x prefix from string
 *
 * @method stripHexPrefix
 * @param {String} str to be checked
 * @returns {String}
 */
const stripHexPrefix = function (str: string) {
  if (str !== "0" && isHex(str)) return str.replace(/^(-)?0x/i, "$1");
  return str;
};

export {
  isBN,
  toBN,
  utf8ToHex,
  hexToUtf8,
  hexToNumber,
  hexToNumberString,
  numberToHex,
  toHex,
  hexToBytes,
  bytesToHex,
  isHex,
  isHexStrict,
  stripHexPrefix,
  leftPad,
  rightPad,
};
