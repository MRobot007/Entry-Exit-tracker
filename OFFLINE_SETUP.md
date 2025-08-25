# Offline Functionality Setup Guide

This guide explains how the Entry/Exit Tracker application now works offline and how to set it up.

## 🚀 Offline Features

The application now supports full offline functionality with the following features:

### ✅ What Works Offline

1. **Record Entries/Exits**: Add new entries and exits manually or via QR scanning
2. **Register People**: Add new people and generate QR codes
3. **View Data**: Browse all recorded entries and registered people
4. **Search & Filter**: Search and filter through offline data
5. **Statistics**: View real-time statistics from offline data
6. **QR Code Generation**: Generate QR codes for new people
7. **Data Export**: Export offline data as JSON

### 🔄 Synchronization

- **Automatic Sync**: Data syncs automatically when connection is restored
- **Manual Sync**: Force sync button available in the UI
- **Sync Queue**: Pending changes are queued and synced in order
- **Conflict Resolution**: Handles sync conflicts gracefully
- **Retry Logic**: Failed syncs are retried up to 3 times

## 🛠️ Technical Implementation

### 1. IndexedDB Storage

The application uses IndexedDB for robust offline storage:

```typescript
// Storage structure
- entries: OfflineEntry[]
- people: OfflinePerson[]
- syncQueue: SyncQueue[]
- settings: Key-value pairs
```

### 2. Service Worker

A service worker provides:
- **Caching**: Static assets and API responses
- **Offline Fallback**: Serves cached content when offline
- **Background Sync**: Syncs data when connection returns
- **Push Notifications**: Notifications for sync events

### 3. Sync Manager

The sync manager handles:
- **Offline-First**: Always stores locally first
- **Queue Management**: Manages sync queue
- **Status Tracking**: Tracks sync status and errors
- **Conflict Resolution**: Handles data conflicts

## 📱 PWA Features

The application is now a Progressive Web App (PWA) with:

- **Installable**: Can be installed on mobile/desktop
- **Offline Support**: Works without internet connection
- **App-like Experience**: Full-screen, standalone mode
- **Home Screen Shortcuts**: Quick access to common actions

## 🔧 Setup Instructions

### 1. Service Worker Registration

The service worker is automatically registered in `App.tsx`:

```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered successfully');
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
}, []);
```

### 2. Offline Storage Initialization

The offline storage is initialized in the sync manager:

```typescript
private async initializeSync() {
  await offlineStorage.init();
  // ... rest of initialization
}
```

### 3. PWA Manifest

The `manifest.json` file provides PWA configuration:

```json
{
  "name": "Entry/Exit Tracker",
  "short_name": "EntryTracker",
  "display": "standalone",
  "start_url": "/",
  "theme_color": "#3b82f6"
}
```

## 🎯 Usage Guide

### Offline Mode Indicators

The application shows clear indicators when offline:

1. **Status Badge**: Shows "Offline" with red background
2. **Sync Status**: Displays pending sync items count
3. **Toast Messages**: Indicates when actions are performed offline
4. **Error Handling**: Graceful handling of offline scenarios

### Manual Sync

When online, you can:

1. **Force Sync**: Click the sync button to manually sync
2. **Download Data**: Download latest data from Google Sheets
3. **View Sync Status**: Check sync status and errors
4. **Clear Errors**: Clear sync error messages

### Data Management

- **Export Data**: Download all offline data as JSON
- **Import Data**: Import data from another device
- **Clear Data**: Clear all offline data (use with caution)

## 🔍 Troubleshooting

### Common Issues

1. **Service Worker Not Registering**
   - Check browser console for errors
   - Ensure HTTPS is used (required for service workers)
   - Clear browser cache and reload

2. **Data Not Syncing**
   - Check internet connection
   - Verify Google Sheets API credentials
   - Check sync queue for errors
   - Try manual sync

3. **Offline Storage Issues**
   - Clear browser data and reload
   - Check IndexedDB support in browser
   - Verify storage permissions

### Debug Commands

Open browser console and use these commands:

```javascript
// Check sync status
syncManager.getSyncStatus()

// Force sync
syncManager.forceSync()

// Export data
syncManager.exportData()

// Clear all data
syncManager.clearAllData()
```

## 📊 Performance Considerations

### Storage Limits

- **IndexedDB**: Generally 50MB+ available
- **Cache Storage**: Varies by browser
- **Local Storage**: ~5-10MB limit

### Sync Performance

- **Batch Processing**: Syncs items in batches
- **Retry Logic**: Failed items are retried
- **Background Sync**: Syncs when app is not active
- **Incremental Sync**: Only syncs changed data

## 🔒 Security & Privacy

### Data Protection

- **Local Storage**: Data stored locally on device
- **Encryption**: Consider encrypting sensitive data
- **Access Control**: Implement user authentication
- **Data Retention**: Set up data retention policies

### Privacy Considerations

- **Data Ownership**: Users own their offline data
- **Sync Control**: Users control when data syncs
- **Data Export**: Users can export their data
- **Data Deletion**: Users can clear their data

## 🚀 Deployment

### Production Setup

1. **HTTPS Required**: Service workers require HTTPS
2. **Cache Headers**: Set appropriate cache headers
3. **CDN**: Use CDN for static assets
4. **Monitoring**: Monitor sync performance

### Testing Offline

1. **Chrome DevTools**: Use Network tab to simulate offline
2. **Device Testing**: Test on actual mobile devices
3. **Slow Network**: Test with slow network conditions
4. **Storage Limits**: Test with limited storage

## 📈 Future Enhancements

### Planned Features

1. **Real-time Sync**: WebSocket-based real-time updates
2. **Multi-device Sync**: Sync across multiple devices
3. **Advanced Conflict Resolution**: Better conflict handling
4. **Data Compression**: Compress offline data
5. **Selective Sync**: Choose what data to sync

### Performance Optimizations

1. **Lazy Loading**: Load data on demand
2. **Pagination**: Paginate large datasets
3. **Indexing**: Optimize database queries
4. **Caching Strategy**: Improve cache hit rates

## 🤝 Contributing

When contributing to offline functionality:

1. **Test Offline**: Always test offline scenarios
2. **Handle Errors**: Implement proper error handling
3. **User Feedback**: Provide clear user feedback
4. **Performance**: Consider performance impact
5. **Documentation**: Update documentation

## 📞 Support

For issues with offline functionality:

1. Check browser console for errors
2. Verify service worker registration
3. Test with different browsers
4. Check network connectivity
5. Review sync status and errors

---

The offline functionality makes the Entry/Exit Tracker more reliable and user-friendly, especially in areas with poor internet connectivity or when working in remote locations. 