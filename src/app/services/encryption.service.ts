// encryption.service.ts

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class EncryptionService {

    // Utility to encode text into Uint8Array
    private encode(str: string): Uint8Array {
        return new TextEncoder().encode(str);
    }

    // Utility to convert ArrayBuffer to base64
    private toBase64(buffer: ArrayBuffer): string {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    // Utility to generate a random salt
    private generateSalt(length = 16): Uint8Array {
        return crypto.getRandomValues(new Uint8Array(length));
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    // Derive AES-GCM key from password and salt using PBKDF2
    async generateKeyPair(): Promise<CryptoKeyPair> {
        return crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['encrypt', 'decrypt']
        );
    }

    // Encrypt the private key using derived key
    async encryptPrivateKey(privateKey: string, password: string) {
        const salt = this.generateSalt();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(password, salt);

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            this.encode(privateKey)
        );

        return {
            encryptedData: this.toBase64(encrypted),
            salt: this.toBase64(salt),
            iv: this.toBase64(iv)
        };
    }

    async encryptFile(file: File, publicKeyPem: string) {
        // 1. Generate AES-256-GCM key
        const aesKey = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );

        // 2. Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // 3. Read file content
        const fileBuffer = await file.arrayBuffer();

        // 4. Encrypt file content with AES-GCM
        const encryptedFileBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            fileBuffer
        );

        // 5. Export AES key as raw bytes
        const rawAesKey = await crypto.subtle.exportKey('raw', aesKey); // ArrayBuffer

        // 6. Convert PEM to CryptoKey (recipient's public RSA key)
        const binaryDer = atob(publicKeyPem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
        const binaryKey = new Uint8Array([...binaryDer].map(c => c.charCodeAt(0)));

        const publicKey = await crypto.subtle.importKey(
            'spki',
            binaryKey.buffer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            },
            false,
            ['encrypt']
        );

        // 7. Encrypt the AES key using recipient's public key (RSA-OAEP)
        const encryptedAesKeyBuffer = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            rawAesKey
        );

        // 8. Return everything needed for upload
        return {
            encryptedFile: new Blob([encryptedFileBuffer], { type: 'application/octet-stream' }),
            encryptedAesKey: this.toBase64(encryptedAesKeyBuffer),
            iv: this.toBase64(iv),
            originalFileName: file.name,
            mimeType: file.type,
        };
    }

    // Derive AES-GCM key from password and salt using PBKDF2
    private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            this.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100_000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async decryptPrivateKey(encryptedData: string, saltB64: string, ivB64: string, password: string): Promise<CryptoKey> {
        const salt = this.fromBase64(saltB64);
        const iv = this.fromBase64(ivB64);
        const encrypted = this.fromBase64(encryptedData);

        const key = await this.deriveKey(password, salt); // AES-GCM key

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );

        const pem = this.decode(decrypted); // PEM format string
        const binaryDer = this.pemToBinary(pem);

        return await crypto.subtle.importKey(
            'pkcs8',
            binaryDer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            },
            false, // unextractable
            ['decrypt']
        );
    }

    async importPublicKey(pem: string): Promise<CryptoKey> {
        const binaryDer = this.pemToBinary(pem);
        return await crypto.subtle.importKey(
            'spki',
            binaryDer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            },
            false,
            ['encrypt']
        );
    }

    async encryptMessage(publicKeyPem: string, message: string) {
        // Convert PEM to CryptoKey
        const binaryDer = atob(publicKeyPem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
        const binaryKey = new Uint8Array([...binaryDer].map(c => c.charCodeAt(0)));

        const publicKey = await crypto.subtle.importKey(
            'spki',
            binaryKey.buffer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            },
            false,
            ['encrypt']
        );

        const enc = new TextEncoder();
        const encrypted = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            enc.encode(message)
        );

        return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    }

    async decryptMessage(privateKey: CryptoKey, encryptedB64: string): Promise<string> {
        const encryptedArrayBuffer = this.fromBase64(encryptedB64);

        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'RSA-OAEP',
            },
            privateKey,
            encryptedArrayBuffer
        );

        return new TextDecoder().decode(decryptedBuffer);
    }

    async decryptFile(encryptedFileBlob: Blob, encryptedAesKeyB64: string, ivB64: string, type: string, name: string, privateKey: CryptoKey): Promise<any> {
        // 1. Decode inputs
        const encryptedAesKey = this.fromBase64(encryptedAesKeyB64);
        const iv = this.fromBase64(ivB64);

        // 2. Decrypt the AES key using private RSA key
        const rawAesKey = await crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            privateKey,
            encryptedAesKey
        );

        // 3. Import the raw AES key for AES-GCM decryption
        const aesKey = await crypto.subtle.importKey(
            'raw',
            rawAesKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // 4. Read encrypted file data
        const encryptedFileBuffer = await encryptedFileBlob.arrayBuffer();

        // 5. Decrypt the file using AES-GCM
        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            encryptedFileBuffer
        );

        // 6. Return as Blob (or convert to File if needed)
        return {
            file: new File([decryptedBuffer], name, { type }),
            name,
            type,
        };
    }

    async exportPublicKey(key: CryptoKey): Promise<string> {
        const spki = await crypto.subtle.exportKey('spki', key);
        const base64 = this.arrayBufferToBase64(spki);
        return `-----BEGIN PUBLIC KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
    }

    async exportPrivateKey(key: CryptoKey): Promise<string> {
        const pkcs8 = await crypto.subtle.exportKey('pkcs8', key);
        const base64 = this.arrayBufferToBase64(pkcs8);
        return `-----BEGIN PRIVATE KEY-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;
    }

    async blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = (reader.result as string).split(',')[1]; // Remove data:*/*;base64,
                resolve(base64data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    base64ToBlob(base64: string, mimeType: string): Blob {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i += 512) {
            const slice = byteCharacters.slice(i, i + 512);
            const byteNumbers = new Array(slice.length);
            for (let j = 0; j < slice.length; j++) {
                byteNumbers[j] = slice.charCodeAt(j);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: mimeType });
    }

    pemToBinary(pem: string): ArrayBuffer {
        const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
        const binary = atob(b64);
        return new Uint8Array([...binary].map(ch => ch.charCodeAt(0))).buffer;
    }

    fromBase64(str: string): Uint8Array {
        return Uint8Array.from(atob(str), c => c.charCodeAt(0));
    }

    decode(buf: ArrayBuffer): string {
        return new TextDecoder().decode(buf);
    }
}
