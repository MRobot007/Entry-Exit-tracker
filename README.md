# Entry/Exit Tracker - Google Sheets Database

A simple entry/exit tracking application that uses Google Sheets as the database. Track people entering and exiting with QR codes, manual entry, and automatic data storage to Google Sheets.

## Features

- **QR Code Scanning**: Scan QR codes to automatically record entries and exits
- **Manual Entry/Exit**: Record entries and exits manually with optional person details
- **People Management**: Register people and generate QR codes for them
- **Google Sheets Integration**: All data is automatically saved to Google Sheets
- **Real-time Statistics**: View today's entry/exit counts and net count
- **Activity History**: View all recorded entries and exits

## Google Sheets Setup

### 1. Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Rename it to "Entry Exit Tracker Database"
4. Create two sheets (tabs) with these exact names:
   - `Entries`
   - `People`

### 2. Set up the Entries Sheet
1. Click on the "Entries" tab
2. In row 1, add these headers in columns A-F:
   ```
   A1: Timestamp
   B1: Type
   C1: Person Name
   D1: Person ID
   E1: Enrollment No
   F1: User ID
   ```

### 3. Set up the People Sheet
1. Click on the "People" tab
2. In row 1, add these headers in columns A-H:
   ```
   A1: ID
   B1: Name
   C1: Enrollment No
   D1: Email
   E1: Phone
   F1: QR Code Data
   G1: User ID
   H1: Created At
   ```

### 4. Get Your Google Sheet ID
1. Look at your Google Sheet URL
2. Copy the ID from the URL (the long string between `/d/` and `/edit`)
   
   Example URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   
   Sheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### 5. Enable Google Sheets API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

### 6. Create API Key
1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to only Google Sheets API for security

### 7. Make Your Sheet Public (Read-Only)
1. In your Google Sheet, click "Share" button
2. Change access to "Anyone with the link can view"
3. Make sure it's set to "Viewer" permissions

### 8. Configure Your Application
1. Create a `.env` file in your project root
2. Add your credentials:
   ```env
   VITE_GOOGLE_SHEET_ID=your_sheet_id_here
   VITE_GOOGLE_API_KEY=your_api_key_here
   ```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your Google Sheets database (see above)
4. Configure your `.env` file with Google Sheets credentials
5. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. **Add People**: Go to the "Manage People" tab to register people and generate QR codes
2. **QR Scanning**: Use the "QR Scanner" tab to scan QR codes for automatic entry/exit recording
3. **Manual Entry**: Use the "Manual Entry" tab to record entries/exits without QR codes
4. **View Activity**: Check the "All Entries" tab or the Recent Activity section to see all recorded data

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **QR Code**: qrcode library for generation, qr-scanner for reading
- **Database**: Google Sheets API
- **Build Tool**: Vite

## Important Notes

- The Google Sheets API has usage limits (100 requests per 100 seconds per user)
- All data is stored in Google Sheets, making it easily accessible and editable
- QR codes contain person information in JSON format
- The application works offline for QR scanning but requires internet for data saving

## Troubleshooting

**Error: "API key not valid"**
- Make sure your API key is correct
- Check that Google Sheets API is enabled
- Verify the API key restrictions

**Error: "The caller does not have permission"**
- Make sure your sheet is shared publicly with "Anyone with the link can view"
- Check that the sheet ID is correct

**Data not appearing**
- Verify your sheet has the correct headers in the right columns
- Check the browser console for error messages
- Make sure the sheet names are exactly "Entries" and "People"