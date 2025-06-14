import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class IndexedDBService {
    private dbName = 'YapDB';
    private storeName = 'Users';
    private db: IDBDatabase | null = null;
    private dbReady: Promise<void>;

    constructor() {
        this.dbReady = this.initDB(); // Initialize in constructor and store promise
    }

    private initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                console.log('Database already initialized');
                resolve();
                return;
            }

            const request = window.indexedDB.open(this.dbName, 1);

            request.onerror = (event) => {
                const error = (event.target as IDBOpenDBRequest).error;
                console.error('Database initialization error:', error);
                reject(error);
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                console.log('Database initialized:', this.dbName);
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                console.log('Creating object store:', this.storeName);
                db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
            };
        });
    }

    // Wait for initialization before performing operations
    private async ensureDbReady(): Promise<void> {
        await this.dbReady;
        if (!this.db) {
            throw new Error('Database failed to initialize');
        }
    }

    async addData(data: any): Promise<void> {
        await this.ensureDbReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getAllData(): Promise<any[]> {
        await this.ensureDbReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getData(id: number): Promise<any> {
        await this.ensureDbReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateData(data: any): Promise<void> {
        await this.ensureDbReady();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const request = store.put(data); // Uses the keyPath to update if it exists

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}