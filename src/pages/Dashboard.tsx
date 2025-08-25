import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User, Shield, Building2 } from 'lucide-react';
import EntryExitTracker from '@/components/EntryExitTracker';
// import OfflineStatus from '@/components/OfflineStatus';
// import { googleSheetsDB, testGoogleSheetsConnection, diagnoseGoogleSheetsIssues } from '@/lib/googleSheets';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [googleSheetsStatus, setGoogleSheetsStatus] = useState<'connected' | 'failed' | 'unknown'>('unknown');

  useEffect(() => {
    // Simplified initialization
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        // Skip Google Sheets initialization for now
        setGoogleSheetsStatus('unknown');
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleBackToLogin = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p>Initializing Google Sheets connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen college-corporate">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Campus Entry Management System</h1>
                <p className="text-sm text-slate-600">Official College Entry/Exit Tracking Portal</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* <OfflineStatus /> */}
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                <span>Google Sheets Database</span>
                {googleSheetsStatus === 'connected' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ Connected
                  </span>
                )}
                {googleSheetsStatus === 'failed' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ❌ Failed
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToLogin}
                className="flex items-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
                <Building2 className="w-6 h-6 text-blue-600" />
                Welcome to Campus Entry Management System
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-4">
                Manage student registration and track campus entry/exit activities with QR code scanning.
                All data is automatically synchronized with your Google Sheets database for secure record keeping.
              </p>
              {googleSheetsStatus === 'connected' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Google Sheets Connected!</h4>
                  <p className="text-green-700 text-sm mb-3">
                    Your application is successfully connected to Google Sheets. All data will be automatically saved.
                  </p>
                                  <Link 
                  to="/test" 
                  className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  🔍 View Connection Details
                </Link>
                </div>
              ) : googleSheetsStatus === 'failed' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">❌ Google Sheets Connection Failed</h4>
                  <p className="text-red-700 text-sm mb-3">
                    The application couldn't connect to Google Sheets. Check the diagnostic test for details.
                  </p>
                                  <Link 
                  to="/test" 
                  className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  🔍 Run Diagnostic Test
                </Link>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Setup Required:</h4>
                  <p className="text-yellow-700 text-sm mb-3">
                    Make sure you have configured your Google Sheets API credentials in the .env file. 
                    Check the GOOGLE_SHEETS_SETUP.md file for detailed setup instructions.
                  </p>
                  <Link 
                    to="/test" 
                    className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    🔍 Run Google Sheets Diagnostic Test
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Entry Exit Tracker Component */}
          <EntryExitTracker />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;