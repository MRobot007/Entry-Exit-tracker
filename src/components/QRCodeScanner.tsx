
import { useState, useRef, useEffect } from 'react';
import { Camera, X, Scan, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import QrScanner from 'qr-scanner';

interface QRScannerProps {
  onScanSuccess: (personData: any) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QRCodeScanner = ({ onScanSuccess, isOpen, onClose }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [scannedPersonData, setScannedPersonData] = useState<any>(null);
  const [showEntryExitDialog, setShowEntryExitDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !showEntryExitDialog) {
      console.log('Dialog opened, starting scanner...');
      // Add a small delay to ensure video element is ready
      setTimeout(() => {
        if (videoRef.current && isOpen && !showEntryExitDialog) {
          startScanner();
        }
      }, 100);
    } else if (!isOpen) {
      console.log('Dialog closed, stopping scanner...');
      stopScanner();
      setShowEntryExitDialog(false);
      setScannedPersonData(null);
    }

    return () => {
      console.log('Component unmounting, cleaning up...');
      stopScanner();
    };
  }, [isOpen, showEntryExitDialog]);

  const startScanner = async () => {
    if (isInitializing) {
      console.log('Scanner already initializing, skipping...');
      return;
    }

    setIsInitializing(true);
    console.log('Starting QR scanner...');
    
    try {
      if (!videoRef.current) {
        console.log('Video ref not available');
        setIsInitializing(false);
        return;
      }

      // Clean up any existing scanner first
      if (scannerRef.current) {
        console.log('Cleaning up existing scanner...');
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      console.log('Camera available:', hasCamera);
      if (!hasCamera) {
        setHasCamera(false);
        setIsInitializing(false);
        toast({
          title: "No Camera",
          description: "No camera found on this device",
          variant: "destructive"
        });
        return;
      }

      // Request camera permissions explicitly
      try {
        console.log('Requesting camera permissions...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' // Prefer back camera
          } 
        });
        console.log('Camera permissions granted, stopping test stream...');
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.error('Camera permission denied:', permissionError);
        toast({
          title: "Camera Permission Required",
          description: "Please allow camera access to scan QR codes",
          variant: "destructive"
        });
        setHasCamera(false);
        setIsInitializing(false);
        return;
      }

      console.log('Creating new QR scanner...');
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log('QR code detected:', result.data);
          try {
            // Try to parse the QR code data as JSON
            const personData = JSON.parse(result.data);
            
            // Validate that it contains the expected structure
            if (personData.id && personData.name) {
              setScannedPersonData(personData);
              setShowEntryExitDialog(true);
              stopScanner();
              toast({
                title: "QR Code Scanned",
                description: `Detected: ${personData.name}`,
              });
            } else {
              toast({
                title: "Invalid QR Code",
                description: "This QR code is not a valid person code",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('Error parsing QR code:', error);
            toast({
              title: "Invalid QR Code",
              description: "Unable to read person data from QR code",
              variant: "destructive"
            });
          }
        },
        {
          preferredCamera: 'environment', // Use back camera if available
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5,
        }
      );

      scannerRef.current = scanner;
      console.log('Starting scanner...');
      await scanner.start();
      console.log('Scanner started successfully');
      setIsScanning(true);
      setHasCamera(true);
      setIsInitializing(false);

    } catch (error) {
      console.error('Scanner error:', error);
      setHasCamera(false);
      setIsScanning(false);
      setIsInitializing(false);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions and try again.",
        variant: "destructive"
      });
    }
  };

  const stopScanner = () => {
    console.log('Stopping QR scanner...');
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        console.log('Scanner stopped and destroyed');
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setIsInitializing(false);
  };

  const handleClose = () => {
    console.log('Closing QR scanner dialog...');
    stopScanner();
    onClose();
  };

  const handleEntryExit = (type: 'entry' | 'exit') => {
    if (scannedPersonData) {
      onScanSuccess({ ...scannedPersonData, type });
      setShowEntryExitDialog(false);
      setScannedPersonData(null);
      onClose();
    }
  };

  const handleEntryExitCancel = () => {
    setShowEntryExitDialog(false);
    setScannedPersonData(null);
    // Restart scanner for another scan
    if (isOpen) {
      startScanner();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Scan QR Code
            </DialogTitle>
            <DialogDescription>
              Position the QR code within the scanning area to detect person information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {hasCamera ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  playsInline
                  muted
                />
                
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-primary w-48 h-48 rounded-lg border-dashed animate-pulse" />
                  </div>
                )}
                
                {(isInitializing || !isScanning) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <div className="text-center text-white">
                      <Camera className="w-12 h-12 mx-auto mb-2" />
                      <p>{isInitializing ? 'Starting camera...' : 'Initializing camera...'}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-muted rounded-lg">
                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-center text-muted-foreground">
                  Camera not available
                </p>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Please check camera permissions or try a different device
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setHasCamera(true);
                    setIsScanning(false);
                    setIsInitializing(false);
                    setTimeout(() => {
                      startScanner();
                    }, 100);
                  }}
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            )}
            
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Position the QR code within the scanning area
              </p>
              <Button variant="outline" onClick={handleClose} className="w-full">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEntryExitDialog} onOpenChange={handleEntryExitCancel}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Action</DialogTitle>
            <DialogDescription>
              QR code detected for: <span className="font-semibold">{scannedPersonData?.name}</span>
              <br />
              Please select if this is an entry or exit.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button 
              onClick={() => handleEntryExit('entry')}
              className="flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Entry
            </Button>
            <Button 
              onClick={() => handleEntryExit('exit')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Exit
            </Button>
          </div>
          
          <Button 
            variant="ghost" 
            onClick={handleEntryExitCancel}
            className="w-full mt-2"
          >
            Scan Again
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QRCodeScanner;
