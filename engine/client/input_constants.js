export const KEY = {
    _INVALID: -1,
    A: 0,
    B: 1,
    C: 2,
    D: 3,
    E: 4,
    F: 5,
    G: 6,
    H: 7,
    I: 8,
    J: 9,
    K: 10,
    L: 11,
    M: 12,
    N: 13,
    O: 14,
    P: 15,
    Q: 16,
    R: 17,
    S: 18,
    T: 19,
    U: 20,
    V: 21,
    W: 22,
    X: 23,
    Y: 24,
    Z: 25,
    ONE: 26,
    TWO: 27,
    THREE: 28,
    FOUR: 29,
    FIVE: 30,
    SIX: 31,
    SEVEN: 32,
    EIGHT: 33,
    NINE: 34,
    ZERO: 35,
    ARROW_LEFT: 36,
    ARROW_RIGHT: 37,
    ARROW_UP: 38,
    ARROW_DOWN: 39,
    ENTER: 40,
    ESCAPE: 41,
    F1: 42,
    F2: 43,
    F3: 44,
    F4: 45,
    F5: 46,
    F6: 47,
    F7: 48,
    F8: 49,
    F9: 50,
    F10: 51,
    F11: 52,
    F12: 53,
    _COUNT: 54
};

export const MOUSE_BUTTON = {
    _INVALID: -1,
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
    MOUSE_4: 3,
    MOUSE_5: 4,
    _COUNT: 5
};

export const getKeyByCode = function(code) {
    switch(code) {
        case "a":
        case "A": return KEY.A;
        case "b":
        case "B": return KEY.B;
        case "c":
        case "C": return KEY.C;
        case "d":
        case "D": return KEY.D;
        case "e":
        case "E": return KEY.E;
        case "f":
        case "F": return KEY.F;
        case "g":
        case "G": return KEY.G;
        case "h":
        case "H": return KEY.H;
        case "i":
        case "I": return KEY.I;
        case "j":
        case "J": return KEY.J;
        case "k":
        case "K": return KEY.K;
        case "l":
        case "L": return KEY.L;
        case "m":
        case "M": return KEY.M;
        case "n":
        case "N": return KEY.N;
        case "o":
        case "O": return KEY.O;
        case "p":
        case "P": return KEY.P;
        case "q":
        case "Q": return KEY.Q;
        case "r":
        case "R": return KEY.R;
        case "s":
        case "S": return KEY.S;
        case "t":
        case "T": return KEY.T;
        case "u":
        case "U": return KEY.U;
        case "v":
        case "V": return KEY.V;
        case "w":
        case "W": return KEY.W;
        case "x":
        case "X": return KEY.X;
        case "y":
        case "Y": return KEY.Y;
        case "z":
        case "Z": return KEY.Z;

        case "1": return KEY.ONE;
        case "2": return KEY.TWO;
        case "3": return KEY.THREE;
        case "4": return KEY.FOUR;
        case "5": return KEY.FIVE;
        case "6": return KEY.SIX;
        case "7": return KEY.SEVEN;
        case "8": return KEY.EIGHT;
        case "9": return KEY.NINE;
        case "0": return KEY.ZERO;

        case "ArrowLeft": return KEY.ARROW_LEFT;
        case "ArrowRight": return KEY.ARROW_RIGHT;
        case "ArrowUp": return KEY.ARROW_UP;
        case "ArrowDown": return KEY.ARROW_DOWN;
        case "Enter": return KEY.ENTER;
        case "Escape": return KEY.ESCAPE;

        case "F1": return KEY.F1;
        case "F2": return KEY.F2;
        case "F3": return KEY.F3;
        case "F4": return KEY.F4;
        case "F5": return KEY.F5;
        case "F6": return KEY.F6;
        case "F7": return KEY.F7;
        case "F8": return KEY.F8;
        case "F9": return KEY.F9;
        case "F10": return KEY.F10;
        case "F11": return KEY.F11;
        case "F12": return KEY.F12;

        default: return KEY._INVALID;
    }
}

export const getButtonByCode = function(code) {
    switch(code) {
        case "M1": return MOUSE_BUTTON.LEFT;
        case "M2": return MOUSE_BUTTON.RIGHT;
        case "M3": return MOUSE_BUTTON.MIDDLE;
        default: return MOUSE_BUTTON._INVALID;
    }
}   