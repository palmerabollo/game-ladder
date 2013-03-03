function isNormalInteger(str) {
    var n = ~~Number(str);
    return String(n) === str && n >= 0;
}