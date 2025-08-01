# Google Sheets Database Setup Guide

This guide will help you set up Google Sheets as your database for the Entry/Exit Tracker application.

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Rename it to "Entry Exit Tracker Database"
4. Create two sheets (tabs) with these exact names:
   - `Entries`
   - `People`

## Step 2: Set up the Entries Sheet

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

## Step 3: Set up the People Sheet

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

## Step 4: Get Your Google Sheet ID

1. Look at your Google Sheet URL
2. Copy the ID from the URL (the long string between `/d/` and `/edit`)
   
   Example URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   
   Sheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

## Step 5: Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click on it and press "Enable"

## Step 6: Create API Key

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to only Google Sheets API for security

## Step 7: Make Your Sheet Public (Read-Only)

1. In your Google Sheet, click "Share" button
2. Change access to "Anyone with the link can view"
3. Make sure it's set to "Viewer" permissions

## Step 8: Configure Your Application

1. Create a `.env` file in your project root
2. Add your credentials:
   ```env
   VITE_GOOGLE_SHEET_ID=your_sheet_id_here
   VITE_GOOGLE_API_KEY=your_api_key_here
   ```

## Step 9: Test Your Setup

1. Start your application: `npm run dev`
2. Create an account and login
3. Try adding a person and recording entries
4. Check your Google Sheet to see if data appears

## Important Notes

- The Google Sheets API has usage limits (100 requests per 100 seconds per user)
- For production use, consider implementing proper authentication with service accounts
- Keep your API key secure and don't commit it to version control
- The current implementation is read-only optimized; for full CRUD operations, you might need Google Apps Script

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