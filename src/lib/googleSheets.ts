// Google Sheets API integration with OAuth2
const SHEET_ID = '1uqwoyKauV2gzBFmBN6dXpWOWQYTApoZvf3mqpf9A3Zw';
const API_KEY = 'AIzaSyB6pin55i4wfXUOXlUxbs8QFVsQVQxZRfw';

// OAuth2 Configuration
const CLIENT_ID = '476678483199-9nt21id2phnijdelptbbn1gmoc0521ef.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Add timeout configuration
const API_TIMEOUT = 10000; // 10 seconds timeout

// Google Apps Script Web App URL (you'll need to create this)
const GOOGLE_APPS_SCRIPT_URL = ''; // You'll need to add this URL

// OAuth2 Token Management
class OAuth2Manager {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Try to get token from localStorage
    const storedToken = localStorage.getItem('googleOAuthToken');
    const storedExpiry = localStorage.getItem('googleOAuthExpiry');
    
    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
      this.accessToken = storedToken;
      this.tokenExpiry = parseInt(storedExpiry);
      return this.accessToken;
    }

    // Need to authenticate
    return this.authenticate();
  }

  private async authenticate(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create Google OAuth2 popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/oauth2/callback')}&` +
        `scope=${encodeURIComponent(SCOPES.join(' '))}&` +
        `response_type=token`;

      const popup = window.open(
        authUrl,
        'googleOAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups and try again.'));
        return;
      }

      // Listen for the OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          const { access_token, expires_in } = event.data;
          this.accessToken = access_token;
          this.tokenExpiry = Date.now() + (expires_in * 1000);
          
          // Store token
          localStorage.setItem('googleOAuthToken', access_token);
          localStorage.setItem('googleOAuthExpiry', this.tokenExpiry.toString());
          
          popup.close();
          window.removeEventListener('message', handleMessage);
          resolve(access_token);
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          popup.close();
          window.removeEventListener('message', handleMessage);
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', handleMessage);

      // Handle popup closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          reject(new Error('Authentication cancelled'));
        }
      }, 1000);
    });
  }

  async revokeToken(): Promise<void> {
    if (this.accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.accessToken}`, {
          method: 'POST'
        });
      } catch (error) {
        console.error('Error revoking token:', error);
      }
    }
    
    this.accessToken = null;
    this.tokenExpiry = 0;
    localStorage.removeItem('googleOAuthToken');
    localStorage.removeItem('googleOAuthExpiry');
  }
}

// Create OAuth2 manager instance
const oauth2Manager = new OAuth2Manager();

// Helper function to add timeout to fetch requests
const fetchWithTimeout = async (url: string, options: RequestInit = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out after 10 seconds');
    }
    throw error;
  }
};

interface SheetEntry {
  date: string;
  time: string;
  type: 'entry' | 'exit';
  personName: string;
  enrollmentNo: string;
  course: string;
  branch: string;
  semester: string;
}

interface SheetPerson {
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
}

class GoogleSheetsDB {
  private baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

  // Initialize sheets with headers if they don't exist
  async initializeSheets() {
    try {
      console.log('Initializing Google Sheets with ID:', SHEET_ID);
      console.log('Using API Key:', API_KEY.substring(0, 10) + '...');
      
      // First, test basic connection to the spreadsheet
      const testResponse = await fetchWithTimeout(
        `${this.baseUrl}/${SHEET_ID}?key=${API_KEY}`
      );
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('Failed to connect to spreadsheet:', testResponse.status, errorText);
        throw new Error(`Failed to connect to spreadsheet: ${testResponse.status} - ${errorText}`);
      }
      
      const spreadsheetInfo = await testResponse.json();
      console.log('Successfully connected to spreadsheet:', spreadsheetInfo.properties?.title);
      
      // Check if sheets exist, if not create them
      await this.ensureSheetExists('Entries', [
        'Date', 'Time', 'Type', 'Person Name', 'Enrollment No', 'Course', 'Branch', 'Semester'
      ]);
      
      await this.ensureSheetExists('People', [
        'ID', 'Name', 'Enrollment No', 'Email', 'Phone', 'Course', 'Branch', 'Semester', 'Created Date', 'Created Time'
      ]);
    } catch (error) {
      console.error('Error initializing sheets:', error);
      throw error;
    }
  }

  private async ensureSheetExists(sheetName: string, headers: string[]) {
    try {
      console.log(`Checking if sheet '${sheetName}' exists...`);
      
      // Try to read the sheet first
      const response = await fetchWithTimeout(
        `${this.baseUrl}/${SHEET_ID}/values/${sheetName}!A1:Z1?key=${API_KEY}`
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Sheet '${sheetName}' doesn't exist or is empty:`, response.status, errorText);
        console.log(`Creating sheet '${sheetName}' with headers...`);
        
        // Create the sheet by adding headers
        await this.createSheetWithHeaders(sheetName, headers);
      } else {
        const data = await response.json();
        console.log(`Sheet '${sheetName}' exists with ${data.values?.length || 0} header rows`);
      }
    } catch (error) {
      console.error(`Error checking sheet ${sheetName}:`, error);
      // Try to create the sheet anyway
      console.log(`Attempting to create sheet '${sheetName}'...`);
      await this.createSheetWithHeaders(sheetName, headers);
    }
  }

  // Make this method public so it can be called from outside
  async createSheetWithHeaders(sheetName: string, headers: string[]) {
    try {
      console.log(`Creating sheet '${sheetName}' with headers:`, headers);
      
      // Add headers to the sheet
      const values = [headers];
      const response = await fetchWithTimeout(
        `${this.baseUrl}/${SHEET_ID}/values/${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1?valueInputOption=RAW&key=${API_KEY}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: values
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to create sheet ${sheetName}:`, response.status, errorText);
        throw new Error(`Failed to create sheet ${sheetName}: ${response.status} - ${errorText}`);
      }

      console.log(`✅ Successfully created sheet '${sheetName}' with headers`);
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error);
      throw error;
    }
  }

  // Add entry to Entries sheet
  async addEntry(entry: SheetEntry) {
    try {
      const values = [[
        entry.date,
        entry.time,
        entry.type,
        entry.personName,
        entry.enrollmentNo,
        entry.course,
        entry.branch,
        entry.semester
      ]];

      // Try OAuth2 first for write access
      try {
        const accessToken = await oauth2Manager.getAccessToken();
        const response = await fetchWithTimeout(
          `${this.baseUrl}/${SHEET_ID}/values/Entries!A:H:append?valueInputOption=RAW`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              values: values
            })
          }
        );

        if (response.ok) {
          console.log('✅ Entry added to Google Sheets via OAuth2');
          return await response.json();
        }
      } catch (oauthError) {
        console.warn('OAuth2 write failed, falling back to local storage:', oauthError);
      }

      // Fallback to local storage
      this.storeEntryLocally(entry);
      return { success: true, storedLocally: true };
    } catch (error) {
      console.error('Error adding entry:', error);
      this.storeEntryLocally(entry);
      return { success: true, storedLocally: true };
    }
  }

  // Store entry data locally as fallback
  private storeEntryLocally(entry: SheetEntry) {
    try {
      const existingData = localStorage.getItem('entryExitEntries') || '[]';
      const entries = JSON.parse(existingData);
      entries.push(entry);
      localStorage.setItem('entryExitEntries', JSON.stringify(entries));
      console.log('Entry stored locally as fallback');
    } catch (error) {
      console.error('Error storing entry locally:', error);
    }
  }

  // Get all entries for a user
  async getEntries(userId: string): Promise<SheetEntry[]> {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/${SHEET_ID}/values/Entries!A:H?key=${API_KEY}`
      );

      let googleSheetsEntries: SheetEntry[] = [];
      
      if (response.ok) {
        const data = await response.json();
        const rows = data.values || [];
        
        // Skip header row and filter by user ID
        googleSheetsEntries = rows.slice(1)
          .filter((row: string[]) => row[5] === userId) // Assuming User ID is now Course
          .map((row: string[]) => ({
            date: row[0] || '',
            time: row[1] || '',
            type: (row[2] as 'entry' | 'exit') || 'entry',
            personName: row[3] || '',
            enrollmentNo: row[4] || '',
            course: row[5] || '',
            branch: row[6] || '',
            semester: row[7] || ''
          }));
      }

      // Get local data as fallback
      const localEntries = this.getLocalEntries(userId);
      
      // Combine and remove duplicates
      const allEntries = [...googleSheetsEntries, ...localEntries];
      const uniqueEntries = allEntries.filter((entry, index, self) => 
        index === self.findIndex(e => 
          e.date === entry.date && 
          e.time === entry.time && 
          e.type === entry.type
        )
      );
      
      return uniqueEntries;
    } catch (error) {
      console.error('Error getting entries from Google Sheets, using local data:', error);
      return this.getLocalEntries(userId);
    }
  }

  // Get entries from local storage
  private getLocalEntries(userId: string): SheetEntry[] {
    try {
      const existingData = localStorage.getItem('entryExitEntries') || '[]';
      const entries = JSON.parse(existingData);
      return entries.filter((entry: SheetEntry) => entry.course === userId); // Assuming User ID is now Course
    } catch (error) {
      console.error('Error getting local entries:', error);
      return [];
    }
  }

  // Add person to People sheet
  async addPerson(person: SheetPerson) {
    try {
      const values = [[
        person.id,
        person.name,
        person.enrollmentNo,
        person.email,
        person.phone,
        person.course,
        person.branch,
        person.semester,
        person.createdDate,
        person.createdTime
      ]];

      // Try OAuth2 first for write access
      try {
        const accessToken = await oauth2Manager.getAccessToken();
        const response = await fetchWithTimeout(
          `${this.baseUrl}/${SHEET_ID}/values/People!A:J:append?valueInputOption=RAW`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              values: values
            })
          }
        );

        if (response.ok) {
          console.log('✅ Person added to Google Sheets via OAuth2');
          return await response.json();
        }
      } catch (oauthError) {
        console.warn('OAuth2 write failed, falling back to local storage:', oauthError);
      }

      // Fallback to local storage
      this.storePersonLocally(person);
      return { success: true, storedLocally: true };
    } catch (error) {
      console.error('Error adding person:', error);
      this.storePersonLocally(person);
      return { success: true, storedLocally: true };
    }
  }

  // Store person data locally as fallback
  private storePersonLocally(person: SheetPerson) {
    try {
      const existingData = localStorage.getItem('entryExitPeople') || '[]';
      const people = JSON.parse(existingData);
      people.push(person);
      localStorage.setItem('entryExitPeople', JSON.stringify(people));
      console.log('Person stored locally as fallback');
    } catch (error) {
      console.error('Error storing person locally:', error);
    }
  }

  // Get all people for a user (combine Google Sheets and local data)
  async getPeople(userId: string): Promise<SheetPerson[]> {
    try {
      const response = await fetchWithTimeout(
        `${this.baseUrl}/${SHEET_ID}/values/People!A:J?key=${API_KEY}`
      );

      let googleSheetsPeople: SheetPerson[] = [];
      
      if (response.ok) {
        const data = await response.json();
        const rows = data.values || [];
        
        // Skip header row and filter by user ID
        googleSheetsPeople = rows.slice(1)
          .filter((row: string[]) => row[6] === userId) // Assuming User ID is now Course
          .map((row: string[]) => ({
            id: row[0] || '',
            name: row[1] || '',
            enrollmentNo: row[2] || '',
            email: row[3] || '',
            phone: row[4] || '',
            course: row[5] || '',
            branch: row[6] || '',
            semester: row[7] || '',
            createdDate: row[8] || '',
            createdTime: row[9] || ''
          }));
      }

      // Get local data as fallback
      const localPeople = this.getLocalPeople(userId);
      
      // Combine and remove duplicates
      const allPeople = [...googleSheetsPeople, ...localPeople];
      const uniquePeople = allPeople.filter((person, index, self) => 
        index === self.findIndex(p => p.id === person.id)
      );
      
      return uniquePeople;
    } catch (error) {
      console.error('Error getting people from Google Sheets, using local data:', error);
      return this.getLocalPeople(userId);
    }
  }

  // Get people from local storage
  private getLocalPeople(userId: string): SheetPerson[] {
    try {
      const existingData = localStorage.getItem('entryExitPeople') || '[]';
      const people = JSON.parse(existingData);
      return people.filter((person: SheetPerson) => person.course === userId); // Assuming User ID is now Course
    } catch (error) {
      console.error('Error getting local people:', error);
      return [];
    }
  }

  // Delete person (this is more complex with Google Sheets, so we'll mark as deleted)
  async deletePerson(personId: string, userId: string) {
    // For simplicity, we'll just not show deleted people in the UI
    // In a real implementation, you'd need to find the row and delete it
    console.log('Delete person functionality would need Google Apps Script for full implementation');
  }

  // Clear all entries for a user
  async clearEntries(userId: string) {
    // This would also need Google Apps Script for full implementation
    console.log('Clear entries functionality would need Google Apps Script for full implementation');
  }
}

export const googleSheetsDB = new GoogleSheetsDB();

// OAuth2 callback handler
export const handleOAuth2Callback = () => {
  const urlParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = urlParams.get('access_token');
  const expiresIn = urlParams.get('expires_in');
  const error = urlParams.get('error');

  if (error) {
    window.opener?.postMessage({
      type: 'GOOGLE_OAUTH_ERROR',
      error: error
    }, window.location.origin);
  } else if (accessToken && expiresIn) {
    window.opener?.postMessage({
      type: 'GOOGLE_OAUTH_SUCCESS',
      access_token: accessToken,
      expires_in: parseInt(expiresIn)
    }, window.location.origin);
  }

  window.close();
};

// Export OAuth2 functions
export const authenticateWithGoogle = async () => {
  try {
    const token = await oauth2Manager.getAccessToken();
    return { success: true, token };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const revokeGoogleAuth = async () => {
  await oauth2Manager.revokeToken();
  return { success: true };
};

// Check if OAuth2 is authenticated
export const isOAuth2Authenticated = async (): Promise<boolean> => {
  try {
    await oauth2Manager.getAccessToken();
    return true;
  } catch {
    return false;
  }
};

// Test function to check Google Sheets connection
export const testGoogleSheetsConnection = async () => {
  try {
    console.log('🧪 Testing Google Sheets Connection...');
    console.log('Sheet ID:', SHEET_ID);
    console.log('API Key (first 10 chars):', API_KEY.substring(0, 10) + '...');
    
    const response = await fetchWithTimeout(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Connection failed:', response.status, errorText);
      return { success: false, error: `${response.status}: ${errorText}` };
    }
    
    const data = await response.json();
    console.log('✅ Connection successful!');
    console.log('Spreadsheet title:', data.properties?.title);
    console.log('Available sheets:', data.sheets?.map((s: any) => s.properties?.title));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Connection error:', error);
    return { success: false, error: error.message };
  }
};

// Function to manually create required sheets
export const createRequiredSheets = async () => {
  try {
    console.log('🔧 Creating required sheets...');
    
    // Create Entries sheet
    const entriesHeaders = ['Date', 'Time', 'Type', 'Person Name', 'Enrollment No', 'Course', 'Branch', 'Semester'];
    await googleSheetsDB.createSheetWithHeaders('Entries', entriesHeaders);
    
    // Create People sheet
    const peopleHeaders = ['ID', 'Name', 'Enrollment No', 'Email', 'Phone', 'Course', 'Branch', 'Semester', 'Created At'];
    await googleSheetsDB.createSheetWithHeaders('People', peopleHeaders);
    
    console.log('✅ Successfully created required sheets!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error creating sheets:', error);
    return { success: false, error: error.message };
  }
};

// Alternative function to create sheets using append method
export const createSheetsManually = async () => {
  try {
    console.log('🔧 Creating sheets manually...');
    
    // Create Entries sheet headers
    const entriesHeaders = ['Date', 'Time', 'Type', 'Person Name', 'Enrollment No', 'Course', 'Branch', 'Semester'];
    const entriesResponse = await fetchWithTimeout(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Entries!A1:H1:append?valueInputOption=RAW&key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [entriesHeaders]
        })
      }
    );

    if (!entriesResponse.ok) {
      const errorText = await entriesResponse.text();
      console.error('Failed to create Entries sheet:', errorText);
      throw new Error(`Failed to create Entries sheet: ${errorText}`);
    }

    // Create People sheet headers
    const peopleHeaders = ['ID', 'Name', 'Enrollment No', 'Email', 'Phone', 'Course', 'Branch', 'Semester', 'Created Date', 'Created Time'];
    const peopleResponse = await fetchWithTimeout(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/People!A1:J1:append?valueInputOption=RAW&key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [peopleHeaders]
        })
      }
    );

    if (!peopleResponse.ok) {
      const errorText = await peopleResponse.text();
      console.error('Failed to create People sheet:', errorText);
      throw new Error(`Failed to create People sheet: ${errorText}`);
    }

    console.log('✅ Successfully created both sheets!');
    return { success: true };
  } catch (error) {
    console.error('❌ Error creating sheets manually:', error);
    return { success: false, error: error.message };
  }
};

// Comprehensive diagnostic function
export const diagnoseGoogleSheetsIssues = async () => {
  const diagnostics = {
    apiKeyValid: false,
    apiEnabled: false,
    sheetAccessible: false,
    sheetExists: false,
    permissions: false,
    errors: [] as string[]
  };

  try {
    console.log('🔍 Starting Google Sheets Diagnostics...');
    
    // Test 1: Check if API key is valid format
    if (!API_KEY || API_KEY.length < 20) {
      diagnostics.errors.push('API key appears to be invalid or too short');
    } else {
      diagnostics.apiKeyValid = true;
      console.log('✅ API key format looks valid');
    }

    // Test 2: Test basic API connectivity
    try {
      const response = await fetchWithTimeout(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?key=${API_KEY}`
      );
      
      if (response.status === 400) {
        diagnostics.errors.push('Bad Request - Check API key and sheet ID');
      } else if (response.status === 401) {
        diagnostics.errors.push('Unauthorized - API key is invalid or restricted');
      } else if (response.status === 403) {
        diagnostics.errors.push('Forbidden - Google Sheets API not enabled or quota exceeded');
      } else if (response.status === 404) {
        diagnostics.errors.push('Sheet not found - Check sheet ID or permissions');
      } else if (response.ok) {
        diagnostics.apiEnabled = true;
        diagnostics.sheetAccessible = true;
        console.log('✅ API is enabled and sheet is accessible');
        
        const data = await response.json();
        if (data.properties?.title) {
          diagnostics.sheetExists = true;
          console.log('✅ Sheet exists:', data.properties.title);
        }
      } else {
        diagnostics.errors.push(`Unexpected error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      diagnostics.errors.push(`Network error: ${error.message}`);
    }

    // Test 3: Check if required sheets exist
    if (diagnostics.sheetAccessible) {
      try {
        const entriesResponse = await fetchWithTimeout(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Entries!A1:Z1?key=${API_KEY}`
        );
        
        if (entriesResponse.ok) {
          console.log('✅ Entries sheet exists');
        } else {
          diagnostics.errors.push('Entries sheet not found or not accessible');
        }
        
        const peopleResponse = await fetchWithTimeout(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/People!A1:Z1?key=${API_KEY}`
        );
        
        if (peopleResponse.ok) {
          console.log('✅ People sheet exists');
        } else {
          diagnostics.errors.push('People sheet not found or not accessible');
        }
      } catch (error) {
        diagnostics.errors.push(`Error checking sheets: ${error.message}`);
      }
    }

    // Test 4: Check permissions by trying to read data
    if (diagnostics.sheetAccessible) {
      try {
        const testResponse = await fetchWithTimeout(
          `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Entries!A1:A10?key=${API_KEY}`
        );
        
        if (testResponse.ok) {
          diagnostics.permissions = true;
          console.log('✅ Read permissions confirmed');
        } else {
          const errorText = await testResponse.text();
          console.error('❌ Read permission test failed:', testResponse.status, errorText);
          
          if (testResponse.status === 403) {
            diagnostics.errors.push('Read permission denied - Spreadsheet needs to be shared with "Anyone with the link can view"');
          } else if (testResponse.status === 404) {
            diagnostics.errors.push('Sheet range not found - Check if "Entries" sheet exists');
          } else {
            diagnostics.errors.push(`Read permission error: ${testResponse.status} - ${errorText}`);
          }
        }
      } catch (error) {
        diagnostics.errors.push(`Permission test failed: ${error.message}`);
      }
    }

  } catch (error) {
    diagnostics.errors.push(`Diagnostic error: ${error.message}`);
  }

  console.log('📊 Diagnostic Results:', diagnostics);
  return diagnostics;
};