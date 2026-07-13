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
exports.generateAbaHash = generateAbaHash;
const crypto = __importStar(require("crypto"));
function generateAbaHash(params, apiKey) {
    const hashString = (params.req_time || '') +
        (params.merchant_id || '') +
        (params.tran_id || '') +
        (params.amount || '') +
        (params.items || '') +
        (params.shipping || '') +
        (params.firstname || '') +
        (params.lastname || '') +
        (params.email || '') +
        (params.phone || '') +
        (params.type || '') +
        (params.payment_option || '') +
        (params.return_url || '') +
        (params.cancel_url || '') +
        (params.continue_success_url || '') +
        (params.return_params || '');
    const hmac = crypto.createHmac('sha512', apiKey);
    hmac.update(hashString);
    return hmac.digest('base64');
}
//# sourceMappingURL=aba-hash.util.js.map