export declare function deriveWingKey(clientId: string): Buffer;
export declare function deriveWingIV(clientId: string): Buffer;
export declare function encryptAES256GCM(plainText: string, key: Buffer, iv: Buffer): string;
export declare function decryptAES256GCM(base64CipherText: string, key: Buffer, iv: Buffer): string;
export declare function generatePayloadHash(clientId: string, amount: string, currency: string, orderReferenceNo: string, returnUrl: string, cancelUrl: string, timestamp: string, key: Buffer, iv: Buffer): string;
