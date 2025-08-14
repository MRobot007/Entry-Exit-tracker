import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { syncManager, type SyncStatus } from '@/lib/syncManager';
import { useToast } from '@/hooks/use-toast';

const OfflineStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getSyncStatus());
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);

  const handleForceSync = async () => {
    try {
      await syncManager.forceSync();
      toast({
        title: 'Sync Complete',
        description: 'All pending data has been synchronized',
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDownloadData = async () => {
    try {
      await syncManager.downloadFromGoogleSheets();
      toast({
        title: 'Download Complete',
        description: 'Data downloaded from Google Sheets',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = () => {
    if (syncStatus.isSyncing) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    return syncStatus.isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />;
  };

  const getStatusColor = () => {
    if (syncStatus.isSyncing) return 'bg-blue-500';
    if (!syncStatus.isOnline) return 'bg-red-500';
    if (syncStatus.pendingItems > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (syncStatus.isSyncing) return 'Syncing...';
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.pendingItems > 0) return `${syncStatus.pendingItems} pending`;
    return 'Online';
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSync) return 'Never';
    const date = new Date(syncStatus.lastSync);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {/* Status Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={`flex items-center gap-1 ${getStatusColor()} text-white`}
            >
              {getStatusIcon()}
              <span className="hidden sm:inline">{getStatusText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {syncStatus.isOnline ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span>{syncStatus.isOnline ? 'Connected' : 'Offline Mode'}</span>
              </div>
              {syncStatus.pendingItems > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span>{syncStatus.pendingItems} items pending sync</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Last sync: {formatLastSync()}</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Action Buttons */}
        {syncStatus.isOnline && syncStatus.pendingItems > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleForceSync}
                disabled={syncStatus.isSyncing}
                className="h-7 px-2"
              >
                <RefreshCw className={`w-3 h-3 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sync pending data</p>
            </TooltipContent>
          </Tooltip>
        )}

        {syncStatus.isOnline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadData}
                className="h-7 px-2"
              >
                <Wifi className="w-3 h-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download from Google Sheets</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Sync Errors */}
        {syncStatus.syncErrors.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive" className="cursor-pointer">
                <AlertCircle className="w-3 h-3 mr-1" />
                {syncStatus.syncErrors.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">Sync Errors:</p>
                {syncStatus.syncErrors.slice(0, 3).map((error, index) => (
                  <p key={index} className="text-xs text-red-600">{error}</p>
                ))}
                {syncStatus.syncErrors.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{syncStatus.syncErrors.length - 3} more errors
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default OfflineStatus; 