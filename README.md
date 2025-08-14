# Entry/Exit Tracker - Google Sheets Database

A modern React-based entry/exit tracking application that uses Google Sheets as the database. Track people entering and exiting with QR codes, manual entry, and automatic data storage to Google Sheets.

![Entry Exit Tracker](https://img.shields.io/badge/React-18.0.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue)
![Vite](https://img.shields.io/badge/Vite-5.0.0-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0.0-cyan)

## ✨ Features

- **📱 QR Code Scanning**: Scan QR codes to automatically record entries and exits
- **✍️ Manual Entry/Exit**: Record entries and exits manually with comprehensive form
- **👥 People Management**: Register people and generate QR codes for them
- **📊 Google Sheets Integration**: All data is automatically saved to Google Sheets
- **📈 Real-time Statistics**: View today's entry/exit counts and net count
- **📋 Activity History**: View all recorded entries and exits
- **🎨 Modern UI**: Beautiful interface built with Shadcn/ui and Tailwind CSS
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Sheets API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/entry-exit-tracker.git
   cd entry-exit-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google Sheets**
   - Follow the setup instructions in [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)
   - Create your Google Sheets database
   - Configure OAuth2 credentials

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 📋 Google Sheets Setup

### 1. Create a Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Rename it to "Entry Exit Tracker Database"
4. Create two sheets (tabs) with these exact names:
   - `Entries`
   - `People`

### 2. Set up the Entries Sheet
1. Click on the "Entries" tab
2. In row 1, add these headers in columns A-H:
   ```
   A1: Date
   B1: Time
   C1: Type
   D1: Person Name
   E1: Enrollment No
   F1: Course
   G1: Branch
   H1: Semester
   ```

### 3. Set up the People Sheet
1. Click on the "People" tab
2. In row 1, add these headers in columns A-I:
   ```
   A1: ID
   B1: Name
   C1: Enrollment No
   D1: Email
   E1: Phone
   F1: Course
   G1: Branch
   H1: Semester
   I1: Created Date
   J1: Created Time
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
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### 6. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_GOOGLE_SHEET_ID=your_sheet_id_here
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: Shadcn/ui, Tailwind CSS
- **Icons**: Lucide React
- **QR Code**: qr-scanner, qrcode
- **Database**: Google Sheets API
- **Authentication**: Google OAuth2

## 📁 Project Structure

```
entry-exit-tracker/
├── src/
│   ├── components/
│   │   ├── EntryExitTracker.tsx    # Main tracking component
│   │   ├── PersonManager.tsx       # People management
│   │   ├── QRCodeScanner.tsx       # QR code scanning
│   │   └── ui/                     # Shadcn/ui components
│   ├── lib/
│   │   └── googleSheets.ts         # Google Sheets integration
│   ├── pages/
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   └── Index.tsx               # Landing page
│   └── main.tsx                    # App entry point
├── public/                         # Static assets
├── GOOGLE_SHEETS_SETUP.md          # Setup instructions
├── README.md                       # This file
└── package.json                    # Dependencies
```

## 🎯 Usage

### QR Code Scanning
1. Register people in the "People Management" tab
2. Download their QR codes
3. Use the QR scanner to record entries/exits

### Manual Entry
1. Go to the "Manual Entry" tab
2. Fill in the person's details
3. Click "Record Entry" or "Record Exit"

### View Statistics
- Today's net count (entries - exits)
- Total entries and exits
- Number of registered people
- Recent activity feed

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

If you encounter any issues or have questions:

1. Check the [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) for setup help
2. Open an issue on GitHub
3. Contact the maintainers

## 🙏 Acknowledgments

- [Shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons
- [Google Sheets API](https://developers.google.com/sheets/api) for database functionality

---

Made with ❤️ for efficient entry/exit tracking