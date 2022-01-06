
class KeyData {
    constructor(key, func, repeat = ture) {
        this.key = key;
        this.func = func;
        this.repeat = repeat;
    }
}

class KeybordState {

    constructor() {
        this.onKeys = new Map();
        this.keyState = {};
        document.addEventListener('keydown', (e) => {

            this.keyState[e.key] = true;
            this.onKeys.forEach((value, onKey) => {
                if (onKey.key === e.key) {

                    if (onKey.repeat === false && e.repeat === ture) return;
                    onKey.func();
                }
            });
        });
        document.addEventListener('keyup', (e) => {

            this.keyState[e.key] = false;
        });
    }

    addKeyEvent(key, func, repeat = true) {
        const keyData = new KeyData(key, func, repeat);
        this.onKeys.set(keyData);

        return keyData;
    }

    deleteKeyEvent(keydata) {
        this.onKeys.delete(keyData);
    }

    isDown(key) {
        return this.keyState[key] === true;
    }
}

export default new KeybordState;

