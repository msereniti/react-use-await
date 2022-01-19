"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
var promiseCaches = [];
var usePromise = function (promise, inputs, lifespan) {
    var e_1, _a;
    if (lifespan === void 0) { lifespan = 0; }
    try {
        for (var promiseCaches_1 = __values(promiseCaches), promiseCaches_1_1 = promiseCaches_1.next(); !promiseCaches_1_1.done; promiseCaches_1_1 = promiseCaches_1.next()) {
            var promiseCache_1 = promiseCaches_1_1.value;
            if ((0, fast_deep_equal_1.default)(inputs, promiseCache_1.inputs)) {
                if (Object.prototype.hasOwnProperty.call(promiseCache_1, 'error')) {
                    throw promiseCache_1.error;
                }
                if (Object.prototype.hasOwnProperty.call(promiseCache_1, 'response')) {
                    return promiseCache_1.response;
                }
                throw promiseCache_1.promise;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (promiseCaches_1_1 && !promiseCaches_1_1.done && (_a = promiseCaches_1.return)) _a.call(promiseCaches_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var promiseCache = {
        promise: promise.apply(void 0, __spreadArray([], __read(inputs), false)).then(function (response) {
            promiseCache.response = response;
        })
            .catch(function (e) {
            promiseCache.error = e;
        })
            .then(function () {
            if (lifespan > 0) {
                setTimeout(function () {
                    var index = promiseCaches.indexOf(promiseCache);
                    if (index !== -1) {
                        promiseCaches.splice(index, 1);
                    }
                }, lifespan);
            }
        }),
        inputs: inputs,
    };
    promiseCaches.push(promiseCache);
    throw promiseCache.promise;
};
exports.default = usePromise;
