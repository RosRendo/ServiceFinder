"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveWingKey = deriveWingKey;
exports.deriveWingIV = deriveWingIV;
exports.encryptAES256GCM = encryptAES256GCM;
exports.decryptAES256GCM = decryptAES256GCM;
exports.generatePayloadHash = generatePayloadHash;
const crypto = __importStar(require("crypto"));
function deriveWingKey(clientId) {
    const padded = clientId.padEnd(32, '0').slice(0, 32);
    return Buffer.from(padded, 'utf8');
}
function deriveWingIV(clientId) {
    const sliced = clientId.slice(0, 12);
    return Buffer.from(sliced, 'utf8');
}
function encryptAES256GCM(plainText, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([encrypted, tag]);
    return combined.toString('base64');
}
function decryptAES256GCM(base64CipherText, key, iv) {
    const dataBuffer = Buffer.from(base64CipherText, 'base64');
    const ciphertext = dataBuffer.subarray(0, dataBuffer.length - 16);
    const tag = dataBuffer.subarray(dataBuffer.length - 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);
    return decrypted.toString('utf8');
}
function generatePayloadHash(clientId, amount, currency, orderReferenceNo, returnUrl, cancelUrl, timestamp, key, iv) {
    const rawStr = `${clientId}#${amount}#${currency}#${orderReferenceNo}#${returnUrl}#${cancelUrl}#${timestamp}`;
    const b64Str = Buffer.from(rawStr, 'utf8').toString('base64');
    const aesB64 = encryptAES256GCM(b64Str, key, iv);
    return crypto.createHash('sha256').update(aesB64).digest('hex');
}
//# sourceMappingURL=wing-crypto.util.js.map