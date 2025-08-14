import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  testGoogleSheetsConnection, 
  diagnoseGoogleSheetsIssues,
  createRequiredSheets,
  createSheetsManually,
  googleSheetsDB 
} from '@/lib/googleSheets';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const GoogleSheetsTest = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSheets, setIsCreatingSheets] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults(null);
    setDiagnostics(null);

    try {
      // Run diagnostics
      const diagResults = await diagnoseGoogleSheetsIssues();
      setDiagnostics(diagResults);

      // Run connection test
      const connectionResults = await testGoogleSheetsConnection();
      setTestResults(connectionResults);
    } catch (error) {
      console.error('Test error:', error);
      setTestResults({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const createSheets = async () => {
    setIsCreatingSheets(true);
    try {
      console.log('Starting sheet creation...');
      
      // Try the alternative method first
      let result = await createSheetsManually();
      
      if (!result.success) {
        console.log('Alternative method failed, trying original method...');
        result = await createRequiredSheets();
      }
      
      console.log('Sheet creation result:', result);
      
      if (result.success) {
        console.log('Sheets created successfully, re-running tests...');
        // Re-run tests after creating sheets
        await runTests();
      } else {
        console.error('Failed to create sheets:', result.error);
        alert(`Failed to create sheets: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating sheets:', error);
      alert(`Error creating sheets: ${error.message}`);
    } finally {
      setIsCreatingSheets(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-500">PASS</Badge>
    ) : (
      <Badge variant="destructive">FAIL</Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-6 h-6" />
              Google Sheets API Diagnostic Tool
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This tool will help you diagnose issues with your Google Sheets API setup.
              Click the button below to run comprehensive tests.
            </p>
            <Button 
              onClick={runTests} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Running Tests...' : 'Run Diagnostic Tests'}
            </Button>
          </CardContent>
        </Card>

        {diagnostics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Diagnostic Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>API Key Valid</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.apiKeyValid)}
                    {getStatusBadge(diagnostics.apiKeyValid)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>API Enabled</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.apiEnabled)}
                    {getStatusBadge(diagnostics.apiEnabled)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Sheet Accessible</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.sheetAccessible)}
                    {getStatusBadge(diagnostics.sheetAccessible)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Sheet Exists</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.sheetExists)}
                    {getStatusBadge(diagnostics.sheetExists)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Read Permissions</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.permissions)}
                    {getStatusBadge(diagnostics.permissions)}
                  </div>
                </div>
              </div>

              {diagnostics.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <strong>Issues Found:</strong>
                      <ul className="list-disc list-inside space-y-1">
                        {diagnostics.errors.map((error: string, index: number) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                      {(diagnostics.errors.some((error: string) => 
                        error.includes('Entries sheet not found') || 
                        error.includes('People sheet not found')
                      )) && (
                        <div className="mt-3">
                          <Button 
                            onClick={createSheets} 
                            disabled={isCreatingSheets}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isCreatingSheets ? 'Creating Sheets...' : '🔧 Create Missing Sheets'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {testResults.success ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-500" />
                )}
                Connection Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.success ? (
                <div className="space-y-2">
                  <p className="text-green-600 font-medium">✅ Connection successful!</p>
                  {testResults.data?.properties?.title && (
                    <p>Spreadsheet: {testResults.data.properties.title}</p>
                  )}
                  {testResults.data?.sheets && (
                    <div>
                      <p className="font-medium">Available sheets:</p>
                      <ul className="list-disc list-inside">
                        {testResults.data.sheets.map((sheet: any, index: number) => (
                          <li key={index}>{sheet.properties?.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Connection failed:</strong> {testResults.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnostics && !diagnostics.permissions && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <strong className="text-orange-800">Read Permissions Issue Detected!</strong>
                    <p className="text-orange-700 text-sm">
                      Your API key is working, but the spreadsheet isn't shared properly. Follow these steps:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-orange-700 space-y-1">
                      <li>Open your Google Spreadsheet</li>
                      <li>Click the "Share" button in the top right</li>
                      <li>Click "Change to anyone with the link"</li>
                      <li>Set permission to "Viewer"</li>
                      <li>Click "Done"</li>
                      <li>Run the test again</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <h4 className="font-medium">1. Check API Key</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Verify your API key is correct and not expired</li>
                <li>Check if API key has restrictions (IP, referrer, etc.)</li>
                <li>Make sure the key is for the correct Google Cloud project</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">2. Enable Google Sheets API</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Go to Google Cloud Console</li>
                <li>Navigate to APIs & Services {' > '} Library</li>
                <li>Search for "Google Sheets API" and enable it</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">3. Check Spreadsheet Permissions</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Make sure the spreadsheet is shared with "Anyone with the link can view"</li>
                <li>Verify the sheet ID is correct</li>
                <li>Check that the required sheets ("Entries" and "People") exist</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">4. Check Quota Limits</h4>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Google Sheets API has usage limits</li>
                <li>Check your quota usage in Google Cloud Console</li>
                <li>Consider upgrading if you've exceeded limits</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GoogleSheetsTest; 