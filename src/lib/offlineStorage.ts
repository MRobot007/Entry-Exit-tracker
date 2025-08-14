// Offline Storage System using IndexedDB
interface OfflineEntry {
  id: string;
  date: string;
  time: string;
  type: 'entry' | 'exit';
  personName: string;
  enrollmentNo: string;
  course: string;
  branch: string;
  semester: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: number;
  lastModified: number;
}

interface OfflinePerson {
  id: string;
  name: string;
  enrollmentNo: string;
  email: string;
  phone: string;
  course: string;
  branch: string;
  semester: string;
  createdDate: string;
  createdTime: string;
  qrCodeData?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: number;
  lastModified: number;
}

interface SyncQueue {
  id: string;
  type: 'entry' | 'person';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'EntryExitTrackerDB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('entries')) {
          const entriesStore = db.createObjectStore('entries', { keyPath: 'id' });
          entriesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          entriesStore.createIndex('date', 'date', { unique: false });
          entriesStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('people')) {
          const peopleStore = db.createObjectStore('people', { keyPath: 'id' });
          peopleStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          peopleStore.createIndex('course', 'course', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Entry Management
  async addEntry(entry: Omit<OfflineEntry, 'id' | 'syncStatus' | 'createdAt' | 'lastModified'>): Promise<string> {
    await this.ensureDB();
    const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineEntry: OfflineEntry = {
      ...entry,
      id,
      syncStatus: 'pending',
      createdAt: Date.now(),
      lastModified: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.add(offlineEntry);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getEntries(filters?: {
    date?: string;
    type?: 'entry' | 'exit';
    course?: string;
    limit?: number;
  }): Promise<OfflineEntry[]> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readonly');
      const store = transaction.objectStore('entries');
      const request = store.getAll();

      request.onsuccess = () => {
        let entries = request.result as OfflineEntry[];

        // Apply filters
        if (filters?.date) {
          entries = entries.filter(e => e.date === filters.date);
        }
        if (filters?.type) {
          entries = entries.filter(e => e.type === filters.type);
        }
        if (filters?.course) {
          entries = entries.filter(e => e.course === filters.course);
        }

        // Sort by date/time descending
        entries.sort((a, b) => {
          const dateA = new Date(`${a.date} ${a.time}`);
          const dateB = new Date(`${b.date} ${b.time}`);
          return dateB.getTime() - dateA.getTime();
        });

        // Apply limit
        if (filters?.limit) {
          entries = entries.slice(0, filters.limit);
        }

        resolve(entries);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updateEntrySyncStatus(id: string, status: 'synced' | 'failed'): Promise<void> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['entries'], 'readwrite');
      const store = transaction.objectStore('entries');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (entry) {
          entry.syncStatus = status;
          entry.lastModified = Date.now();
          const updateRequest = store.put(entry);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // People Management
  async addPerson(person: Omit<OfflinePerson, 'syncStatus' | 'createdAt' | 'lastModified'>): Promise<string> {
    await this.ensureDB();
    const id = person.id || `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlinePerson: OfflinePerson = {
      ...person,
      id,
      syncStatus: 'pending',
      createdAt: Date.now(),
      lastModified: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['people'], 'readwrite');
      const store = transaction.objectStore('people');
      const request = store.add(offlinePerson);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPeople(filters?: {
    course?: string;
    search?: string;
  }): Promise<OfflinePerson[]> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['people'], 'readonly');
      const store = transaction.objectStore('people');
      const request = store.getAll();

      request.onsuccess = () => {
        let people = request.result as OfflinePerson[];

        // Apply filters
        if (filters?.course) {
          people = people.filter(p => p.course === filters.course);
        }
        if (filters?.search) {
          const searchTerm = filters.search.toLowerCase();
          people = people.filter(p => 
            p.name.toLowerCase().includes(searchTerm) ||
            p.enrollmentNo.toLowerCase().includes(searchTerm) ||
            p.email.toLowerCase().includes(searchTerm)
          );
        }

        // Sort by creation date descending
        people.sort((a, b) => b.createdAt - a.createdAt);

        resolve(people);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async updatePersonSyncStatus(id: string, status: 'synced' | 'failed'): Promise<void> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['people'], 'readwrite');
      const store = transaction.objectStore('people');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const person = getRequest.result;
        if (person) {
          person.syncStatus = status;
          person.lastModified = Date.now();
          const updateRequest = store.put(person);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Sync Queue Management
  async addToSyncQueue(item: Omit<SyncQueue, 'id'>): Promise<string> {
    await this.ensureDB();
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const syncItem: SyncQueue = {
      ...item,
      id
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.add(syncItem);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueue[]> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = () => {
        const queue = request.result as SyncQueue[];
        queue.sort((a, b) => a.timestamp - b.timestamp);
        resolve(queue);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings Management
  async setSetting(key: string, value: any): Promise<void> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Statistics
  async getStatistics(): Promise<{
    totalEntries: number;
    totalPeople: number;
    pendingSync: number;
    todayEntries: number;
    todayExits: number;
  }> {
    await this.ensureDB();
    
    const [entries, people, syncQueue] = await Promise.all([
      this.getEntries(),
      this.getPeople(),
      this.getSyncQueue()
    ]);

    const today = new Date().toLocaleDateString('en-GB');
    const todayEntries = entries.filter(e => e.date === today && e.type === 'entry').length;
    const todayExits = entries.filter(e => e.date === today && e.type === 'exit').length;

    return {
      totalEntries: entries.length,
      totalPeople: people.length,
      pendingSync: syncQueue.length,
      todayEntries,
      todayExits
    };
  }

  // Data Export/Import
  async exportData(): Promise<{
    entries: OfflineEntry[];
    people: OfflinePerson[];
    settings: any;
  }> {
    const [entries, people] = await Promise.all([
      this.getEntries(),
      this.getPeople()
    ]);

    const settings: any = {};
    const settingKeys = ['lastSync', 'offlineMode', 'deviceId'];
    for (const key of settingKeys) {
      settings[key] = await this.getSetting(key);
    }

    return { entries, people, settings };
  }

  async importData(data: {
    entries: OfflineEntry[];
    people: OfflinePerson[];
    settings: any;
  }): Promise<void> {
    await this.ensureDB();
    
    const transaction = this.db!.transaction(['entries', 'people', 'settings'], 'readwrite');
    
    // Clear existing data
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore('entries');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore('people');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);

    // Import new data
    for (const entry of data.entries) {
      const store = transaction.objectStore('entries');
      store.add(entry);
    }

    for (const person of data.people) {
      const store = transaction.objectStore('people');
      store.add(person);
    }

    for (const [key, value] of Object.entries(data.settings)) {
      const store = transaction.objectStore('settings');
      store.put({ key, value });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Utility methods
  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  async clearAllData(): Promise<void> {
    await this.ensureDB();
    
    const transaction = this.db!.transaction(['entries', 'people', 'syncQueue', 'settings'], 'readwrite');
    
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore('entries');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore('people');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore('syncQueue');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore('settings');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
export type { OfflineEntry, OfflinePerson, SyncQueue }; 