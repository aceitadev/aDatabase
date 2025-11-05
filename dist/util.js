"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelToSnake = camelToSnake;
function camelToSnake(s) {
    return s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}
