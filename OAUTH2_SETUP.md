# OAuth2 Setup Guide for Google Sheets Integration

This guide will help you set up OAuth2 authentication to enable full read/write access to Google Sheets.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create OAuth2 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the following:
   - **Name**: "Entry Exit Tracker"
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (for development)
     - `http://localhost:3000` (if using different port)
     - Add your production domain when ready
   - **Authorized redirect URIs**:
     - `http://localhost:5173/oauth2/callback`
     - `http://localhost:3000/oauth2/callback`
     - Add your production callback URL when ready

## Step 3: Get Your Client ID

1. After creating the OAuth2 client, copy the **Client ID**
2. It will look like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

## Step 4: Update Your Code

1. Open `src/lib/googleSheets.ts`
2. Find this line:
   ```typescript
   const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
   ```
3. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID

## Step 5: Test the Setup

1. Start your application: `npm run dev`
2. Go to your dashboard
3. Try adding a person or recording an entry
4. You should see a Google OAuth2 popup
5. Sign in with your Google account
6. Grant permissions to access your Google Sheets

## Step 6: Verify It's Working

1. Check your Google Spreadsheet
2. You should now see data being written to the "Entries" and "People" sheets
3. The app will show "✅ Entry added to Google Sheets via OAuth2" in the console

## Troubleshooting

### Popup Blocked
- Make sure popups are allowed for your domain
- Check that the redirect URI matches exactly

### Authentication Failed
- Verify your Client ID is correct
- Check that the Google Sheets API is enabled
- Ensure your redirect URIs are properly configured

### Still Not Working
- Check the browser console for error messages
- Verify your Google account has access to the spreadsheet
- Make sure the spreadsheet is shared with your Google account

## Security Notes

- Keep your Client ID secure
- Don't commit it to public repositories
- Use environment variables in production
- Regularly review and revoke unused tokens

## Production Deployment

When deploying to production:

1. Update the authorized origins and redirect URIs in Google Cloud Console
2. Use environment variables for the Client ID
3. Set up proper HTTPS
4. Consider using a service account for server-side operations

## Environment Variables (Recommended)

Create a `.env` file:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

Then update the code to use:
```typescript
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

This keeps your credentials secure and makes deployment easier. 