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
