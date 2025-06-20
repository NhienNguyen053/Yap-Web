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

    async decryptPrivateKey(encryptedBase64: string, password: string, saltBase64: string, ivBase64: string): Promise<string> {
        const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
        const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

        const key = await this.deriveKey(password, salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );

        return new TextDecoder().decode(decrypted);
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

}
