import removePrefix from './utils/remove-prefix';
import assign from './utils/assign';
import isString from './utils/is-string';
import isFunction from './utils/is-function';
import createKeyPrefix from './create-key-prefix';
import iterateStorage from './iterate-storage';
import ensureOptionsValidity from './ensure-options-validity';

class WebStorage {
  /**
   * WebStorage constructor
   *
   * @constructor
   * @param {Object} [options] Object that contains config options to extend defaults.
   * @throws {TypeError} If `options.name` is not a string or an empty string.
   * @throws {TypeError} If `options.keySeparator` is not a string or an empty string.
   */
  constructor(options) {
    /**
     * Default configuration
     * @private
     * @type {Object}
     */
    const defaults = {
      driver: localStorage,
      name: 'web-storage',
      keySeparator: '/'
    };

    options = assign({}, defaults, options);
    ensureOptionsValidity(options);
    this.options = options;
    this.storeKeyPrefix = createKeyPrefix(this);
  }

  /**
   * Gets a saved item from storage by its key
   *
   * @this {WebStorage}
   * @param {String} key The property name of the saved item
   * @param {Function} [onErrorCallback = () => {}] Callback function to be executed if an error occurs
   * @throws {TypeError} Throws if `key` is not a string
   * @returns {*} Returns the retrieved value if found or `null` if value not found or operation has failed due to error
   */
  getItem(key, onErrorCallback = () => {}) {
    if (!isString(key)) {
      throw new TypeError('Failed to execute \'getItem\' on \'Storage\': The first argument must be a string.');
    }

    let res = null;

    try {
      const item = this.options.driver.getItem(this.storeKeyPrefix + key);
      const parsed = JSON.parse(item);
      res = parsed;
    } catch (error) {
      onErrorCallback(error);
    }

    return res;
  }

  /**
   * Saves an item to storage
   *
   * @this {WebStorage}
   * @param {String} key The property name of the item to save
   * @param {*} value The item to save to the selected storage
   * @param {Function} [onErrorCallback = () => {}] Callback function to be executed if an error occurs
   * @throws {TypeError} Throws if `key` is not a string
   * @returns {undefined}
   */
  setItem(key, value, onErrorCallback = () => {}) {
    if (!isString(key)) {
      throw new TypeError('Failed to execute \'setItem\' on \'Storage\': The first argument must be a string.');
    }

    key = this.storeKeyPrefix + key;
    value = value == null || isFunction(value) ? null : value;

    try {
      this.options.driver.setItem(key, JSON.stringify(value));
    } catch (error) {
      onErrorCallback(error);
    }
  }

  /**
   * Removes the item for the specific key from the storage
   *
   * @this {WebStorage}
   * @param {String} key The property name of the item to remove
   * @param {Function} [onErrorCallback = () => {}] Callback function to be executed if an error occurs
   * @throws {TypeError} Throws if `key` is not a string
   * @returns {undefined}
   */
  removeItem(key, onErrorCallback = () => {}) {
    if (!isString(key)) {
      throw new TypeError('Failed to execute \'setItem\' on \'Storage\': The first argument must be a string.');
    }

    try {
      this.options.driver.removeItem(this.storeKeyPrefix + key);
    } catch (error) {
      onErrorCallback(error);
    }
  }

  /**
   * Removes all saved items from storage
   *
   * @this {WebStorage}
   * @param {Function} [onErrorCallback = () => {}] Callback function to be executed if an error occurs
   * @returns {undefined}
   */
  clear(onErrorCallback = () => {}) {
    const driver = this.options.driver;

    try {
      iterateStorage(this, driver.removeItem.bind(driver));
    } catch (error) {
      onErrorCallback(error);
    }
  }

  /**
   * Gets the list of all keys in the offline storage for a specific database
   *
   * @this {WebStorage}
   * @param {Function} [onErrorCallback = () => {}] Callback function to be executed if an error occurs
   * @returns {Array|undefined} Returns an array of all the keys that belong to a specific database. If any error occurs, returns `undefined`.
   */
  keys(onErrorCallback = () => {}) {
    const res = [];
    const storeKeyPrefix = this.storeKeyPrefix;

    try {
      iterateStorage(this, key => res.push(removePrefix(key, storeKeyPrefix)));
      return res;
    } catch (error) {
      onErrorCallback(error);
    }
  }

  /**
   * Gets the number of items saved in a specific database
   *
   * @this {WebStorage}
   * @param {Function} [onErrorCallback = () => {}] Callback function to be executed if an error occurs
   * @returns {Number|undefined} Returns the number of items for a specific database. If any error occurs, returns `undefined`.
   */
  length(onErrorCallback = () => {}) {
    try {
      return this.keys().length;
    } catch (error) {
      onErrorCallback(error);
    }
  }

  /**
   * Iterate over all value/key pairs in datastore
   *
   * @this {WebStorage}
   * @param {function} iteratorCallback A callabck function to be executed for each iteration
   *        `iteratorCallback` is called once for each pair, with the following arguments:
   *        - {*} value The value of the saved item
   *        - {String} key The key of the saved item
   * @param {Function} [onErrorCallback = () => {}] Callback function to be executed if an error occurs
   * @throws {TypeError} If `iteratorCallback` is not a function
   * @returns {undefined}
   */
  iterate(iteratorCallback, onErrorCallback = () => {}) {
    if (!isFunction(iteratorCallback)) {
      throw new TypeError('Failed to iterate on \'Storage\': \'iteratorCallback\' must be a function.');
    }

    const storeKeyPrefix = this.storeKeyPrefix;

    try {
      iterateStorage(this, (key, value) => {
        const _key = removePrefix(key, storeKeyPrefix);
        const _value = JSON.parse(value);
        iteratorCallback.call(this, _value, _key);
      });
    } catch (error) {
      onErrorCallback(error);
    }
  }
}

/**
 * Check if `storage` is supported and is available.
 * Storage might be unavailable due to no browser support or due to being full or due to browser privacy settings.
 *
 * @static
 * @param {Object} storage The storage type; available values `localStorage` or `sessionStorage`
 * @returns {Boolean} Returns `true` if `storage` available; otherwise `false`
 */
WebStorage.isAvailable = storage => {
  const key = '@georapbox/web-storage/test';

  try {
    storage.setItem(key, 'test');
    storage.removeItem(key);
    return true;
  } catch (error) {
    return false;
  }
};

export default WebStorage;
