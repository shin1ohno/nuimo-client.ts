import updates from "./update";


/**
 * @class
 */
export class NuimoClient {
  /**
   * @param {event.EventEmitter}
   * @param {noble.Peripheral}
   */
  constructor (emitter, matrix, peripheral) {
    this._matrix = matrix;
    this._emitter = emitter;
    this._peripheral = peripheral;
  }

  /**
   * @return {Promise<Buffer>}
   */
  get leds () {
    return new Promise((resolve, reject) => {
      this._matrix.read((error, data) => {
        if (!!error) { return reject(error); }
        resolve({
          state: data.slice(0, 10),
          delay: data.readInt8(12) / 10,
          brightness: data.readInt8(11) / 255,
        });
      });
    });
  }

  /**
   * @param Buffer
   * @param {Number?} (in percentage)
   * @param {Number?} (in seconds)
   * @return {Promise<null>}
   */
  writeLEDS (state, brightness=1, delay=0) {
    const scaledBrightness = Math.max(0, Math.min(255, Math.floor(brightness * 255)));
    const scaledDelay = Math.max(0, Math.min(255, Math.floor(delay * 10)));
    const newData = new Buffer(13);

    newData.copy(state, 0, 0, 10);
    newData.writeUInt8(scaledBrightness, 11);
    newData.writeUInt8(scaledDelay, 12);

    return new Promise((resolve, reject) =>
      void this._matrix.write(newData, false, error =>
        void !!error ? reject(error) : resolve(null)));
  }

  /**
   * @param {Function<Update, void>}
   */
  listen (callback) {
    this._emitter.on("data", (data) => {
      callback(updates.updateFactory(data.characteristic, data.buffer));
    });
  }

  /**
   * @param {Function<void>}
   */
  close (callback) {
    this._peripheral.disconnect(callback);
    this._emitter.removeAllListeners("data");
  }
}


export default { NuimoClient };
