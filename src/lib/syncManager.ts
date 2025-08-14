// Sync Manager for handling offline/online data synchronization
import { offlineStorage, type OfflineEntry, type OfflinePerson, type SyncQueue } from './offlineStorage';
import { googleSheetsDB } from './googleSheets';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: number | null;
  pendingItems: number;
  syncErrors: string[];
}

class SyncManager {
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSync: null,
    pendingItems: 0,
    syncErrors: []
  };

  private syncInterval: NodeJS.Timeout | null = null;
  private listeners: ((status: SyncStatus) => void)[] = [];

  constructor() {
    this.initializeSync();
    this.setupEventListeners();
  }

  private async initializeSync() {
    try {
      // Initialize offline storage
      await offlineStorage.init();
      
      // Load last sync time
      const lastSync = await offlineStorage.getSetting('lastSync');
      this.syncStatus.lastSync = lastSync;
      
      // Update pending items count
      await this.updatePendingCount();
      
      // Start periodic sync if online
      if (this.syncStatus.isOnline) {
        this.startPeriodicSync();
      }
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to initialize sync manager:', error);
    }
  }

  private setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true;
      this.startPeriodicSync();
      this.notifyListeners();
      this.syncAllData();
    });

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false;
      this.stopPeriodicSync();
      this.notifyListeners();
    });

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_REQUEST') {
          this.syncAllData();
        }
      });
    }
  }

  // Add entry with offline-first approach
  async addEntry(entryData: Omit<OfflineEntry, 'id' | 'syncStatus' | 'createdAt' | 'lastModified'>): Promise<string> {
    try {
      // Always store locally first
      const entryId = await offlineStorage.addEntry(entryData);
      
      // Add to sync queue
      await offlineStorage.addToSyncQueue({
        type: 'entry',
        action: 'create',
        data: { ...entryData, id: entryId },
        timestamp: Date.now(),
        retryCount: 0
      });

      await this.updatePendingCount();
      this.notifyListeners();

      // Try to sync immediately if online
      if (this.syncStatus.isOnline) {
        this.syncAllData();
      }

      return entryId;
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  }

  // Add person with offline-first approach
  async addPerson(personData: Omit<OfflinePerson, 'syncStatus' | 'createdAt' | 'lastModified'>): Promise<string> {
    try {
      // Always store locally first
      const personId = await offlineStorage.addPerson(personData);
      
      // Add to sync queue
      await offlineStorage.addToSyncQueue({
        type: 'person',
        action: 'create',
        data: { ...personData, id: personId },
        timestamp: Date.now(),
        retryCount: 0
      });

      await this.updatePendingCount();
      this.notifyListeners();

      // Try to sync immediately if online
      if (this.syncStatus.isOnline) {
        this.syncAllData();
      }

      return personId;
    } catch (error) {
      console.error('Failed to add person:', error);
      throw error;
    }
  }

  // Get entries from offline storage
  async getEntries(filters?: {
    date?: string;
    type?: 'entry' | 'exit';
    course?: string;
    limit?: number;
  }): Promise<OfflineEntry[]> {
    return offlineStorage.getEntries(filters);
  }

  // Get people from offline storage
  async getPeople(filters?: {
    course?: string;
    search?: string;
  }): Promise<OfflinePerson[]> {
    return offlineStorage.getPeople(filters);
  }

  // Get statistics from offline storage
  async getStatistics() {
    return offlineStorage.getStatistics();
  }

  // Sync all pending data
  async syncAllData(): Promise<void> {
    if (this.syncStatus.isSyncing || !this.syncStatus.isOnline) {
      return;
    }

    this.syncStatus.isSyncing = true;
    this.notifyListeners();

    try {
      const syncQueue = await offlineStorage.getSyncQueue();
      
      if (syncQueue.length === 0) {
        this.syncStatus.lastSync = Date.now();
        await offlineStorage.setSetting('lastSync', this.syncStatus.lastSync);
        this.notifyListeners();
        return;
      }

      console.log(`Syncing ${syncQueue.length} items...`);

      for (const item of syncQueue) {
        try {
          await this.syncItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          
          // Increment retry count
          item.retryCount++;
          
          // Remove from queue if too many retries
          if (item.retryCount >= 3) {
            await offlineStorage.removeFromSyncQueue(item.id);
            this.syncStatus.syncErrors.push(`Failed to sync ${item.type}: ${error.message}`);
          }
        }
      }

      this.syncStatus.lastSync = Date.now();
      await offlineStorage.setSetting('lastSync', this.syncStatus.lastSync);
      
      await this.updatePendingCount();
      this.notifyListeners();

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncStatus.syncErrors.push(`Sync failed: ${error.message}`);
      this.notifyListeners();
    } finally {
      this.syncStatus.isSyncing = false;
      this.notifyListeners();
    }
  }

  // Sync individual item
  private async syncItem(item: SyncQueue): Promise<void> {
    switch (item.type) {
      case 'entry':
        await this.syncEntry(item);
        break;
      case 'person':
        await this.syncPerson(item);
        break;
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }

  // Sync entry to Google Sheets
  private async syncEntry(item: SyncQueue): Promise<void> {
    const entryData = item.data;
    
    try {
      await googleSheetsDB.addEntry({
        date: entryData.date,
        time: entryData.time,
        type: entryData.type,
        personName: entryData.personName,
        enrollmentNo: entryData.enrollmentNo,
        course: entryData.course,
        branch: entryData.branch,
        semester: entryData.semester
      });

      // Update sync status
      await offlineStorage.updateEntrySyncStatus(entryData.id, 'synced');
    } catch (error) {
      await offlineStorage.updateEntrySyncStatus(entryData.id, 'failed');
      throw error;
    }
  }

  // Sync person to Google Sheets
  private async syncPerson(item: SyncQueue): Promise<void> {
    const personData = item.data;
    
    try {
      await googleSheetsDB.addPerson({
        id: personData.id,
        name: personData.name,
        enrollmentNo: personData.enrollmentNo,
        email: personData.email,
        phone: personData.phone,
        course: personData.course,
        branch: personData.branch,
        semester: personData.semester,
        createdDate: personData.createdDate,
        createdTime: personData.createdTime
      });

      // Update sync status
      await offlineStorage.updatePersonSyncStatus(personData.id, 'synced');
    } catch (error) {
      await offlineStorage.updatePersonSyncStatus(personData.id, 'failed');
      throw error;
    }
  }

  // Download data from Google Sheets to offline storage
  async downloadFromGoogleSheets(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      throw new Error('Cannot download data while offline');
    }

    try {
      // Get data from Google Sheets
      const [googleEntries, googlePeople] = await Promise.all([
        googleSheetsDB.getEntries(''),
        googleSheetsDB.getPeople('default_user')
      ]);

      // Convert to offline format
      const offlineEntries: OfflineEntry[] = googleEntries.map((entry: any) => ({
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: entry.date,
        time: entry.time,
        type: entry.type,
        personName: entry.personName,
        enrollmentNo: entry.enrollmentNo,
        course: entry.course,
        branch: entry.branch,
        semester: entry.semester,
        syncStatus: 'synced',
        createdAt: Date.now(),
        lastModified: Date.now()
      }));

      const offlinePeople: OfflinePerson[] = googlePeople.map((person: any) => ({
        id: person.id,
        name: person.name,
        enrollmentNo: person.enrollmentNo,
        email: person.email || '',
        phone: person.phone || '',
        course: person.course,
        branch: person.branch,
        semester: person.semester,
        createdDate: person.createdDate,
        createdTime: person.createdTime,
        syncStatus: 'synced',
        createdAt: Date.now(),
        lastModified: Date.now()
      }));

      // Import to offline storage
      await offlineStorage.importData({
        entries: offlineEntries,
        people: offlinePeople,
        settings: {
          lastSync: Date.now(),
          offlineMode: false,
          deviceId: await this.getDeviceId()
        }
      });

      this.syncStatus.lastSync = Date.now();
      await offlineStorage.setSetting('lastSync', this.syncStatus.lastSync);
      
      await this.updatePendingCount();
      this.notifyListeners();

      console.log('Data downloaded successfully from Google Sheets');
    } catch (error) {
      console.error('Failed to download data from Google Sheets:', error);
      throw error;
    }
  }

  // Export offline data
  async exportData() {
    return offlineStorage.exportData();
  }

  // Import data to offline storage
  async importData(data: any) {
    await offlineStorage.importData(data);
    await this.updatePendingCount();
    this.notifyListeners();
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    await offlineStorage.clearAllData();
    this.syncStatus.lastSync = null;
    this.syncStatus.pendingItems = 0;
    this.syncStatus.syncErrors = [];
    this.notifyListeners();
  }

  // Get sync status
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Subscribe to sync status changes
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify listeners of status changes
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getSyncStatus()));
  }

  // Update pending items count
  private async updatePendingCount() {
    const syncQueue = await offlineStorage.getSyncQueue();
    this.syncStatus.pendingItems = syncQueue.length;
  }

  // Start periodic sync
  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.syncStatus.isOnline && !this.syncStatus.isSyncing) {
        this.syncAllData();
      }
    }, 30000); // Sync every 30 seconds
  }

  // Stop periodic sync
  private stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get or generate device ID
  private async getDeviceId(): Promise<string> {
    let deviceId = await offlineStorage.getSetting('deviceId');
    
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await offlineStorage.setSetting('deviceId', deviceId);
    }
    
    return deviceId;
  }

  // Force manual sync
  async forceSync(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.syncAllData();
  }

  // Get sync errors
  getSyncErrors(): string[] {
    return [...this.syncStatus.syncErrors];
  }

  // Clear sync errors
  clearSyncErrors(): void {
    this.syncStatus.syncErrors = [];
    this.notifyListeners();
  }
}

export const syncManager = new SyncManager();
export type { SyncStatus }; 