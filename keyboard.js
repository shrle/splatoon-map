
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

        document.addEventListener('keydown', (e) => {

            this.onKeys.forEach((value, onKey) => {
                if (onKey.key === e.key) {

                    if (onKey.repeat === false && e.repeat === ture) return;
                    onKey.func();
                }
            });
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
}

export default new KeybordState;

