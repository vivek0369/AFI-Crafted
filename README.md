# AFI - Crafted (Timber Calculator)

**AFI - Crafted** is a comprehensive, professional-grade Timber Calculator application built with React Native and Expo. Designed specifically for timber merchants, sawmills, and woodworking professionals, this application streamlines complex timber volume calculations, client management, and report generation into a simple, mobile-friendly interface.

---

## 🎯 Key Features

### 1. Advanced Timber Calculations
The app supports multiple calculation types tailored to industry standards:
- **Round Log (CFT):** Calculate round log volume in Cubic Feet (Imperial).
- **Round Log (CBM):** Calculate round log volume in Cubic Meters (Metric).
- **Cut Size (CFT):** Calculate the volume of sawn/cut timber sizes in Cubic Feet.
- **Plywood / Door (SqFt):** Calculate surface area and costs for flat materials.

### 2. Multi-System Measurements
Flexibility to input measurements in the format you prefer:
- **Metric (M × Cm):** Length in meters, width/girth in centimeters.
- **Full Metric (Cm × Cm):** All measurements in centimeters.
- **Imperial (Ft × In):** Length in feet, width/girth in inches.

### 3. Estimate Generation & Reporting
- Generate detailed estimates including allowances, tax, and discount adjustments.
- Save reports locally for offline access.
- Sync reports automatically to a remote **MongoDB Atlas** backend when authenticated.
- **PDF Generation & Sharing:** Generate professional PDF estimates directly on the device using `expo-print` and share them via native sharing sheets (WhatsApp, Email, etc.) using `expo-sharing`.

### 4. Client & Party Management
- Maintain a directory of clients/parties with their names, phone numbers, and addresses.
- Quickly attach saved parties to new estimates.

### 5. Authentication & Cloud Sync
- Built-in **Login & Sign Up** functionality (`app/auth`).
- Secure token-based authentication.
- Automatically syncs all offline data to the live backend when logged in.

### 6. Customizable Settings & Theming
- Toggle between **Dark Mode** and **Light Mode**.
- Set default measurement units and input systems.
- Configure global tax rates, discounts, and default company information for PDF reports.

### 7. Backup & Restore
- Built-in backup and restore functionality.
- Export all local data (reports, parties, settings) to a JSON file.
- Restore data from local backups or imported JSON files.

---

## 🏗️ Technical Stack & Architecture

- **Framework:** React Native with Expo (SDK 54+).
- **Routing:** Expo Router (File-based routing).
- **Language:** TypeScript for strong typing and reliability.
- **Local Storage:** `@react-native-async-storage/async-storage` for offline-first data persistence.
- **File System:** `expo-file-system/legacy` for managing backups, PDFs, and local files.
- **Backend Sync:** Integrated with an external Node.js/MongoDB API (via `constants/api.ts`).

### Project Structure
```text
/
├── app/                  # Expo Router pages and layouts
│   ├── (tabs)/           # Main tab navigation (Home, Saved Reports, Settings)
│   ├── backup/           # Backup and Restore screen
│   ├── calculator/       # Dynamic calculator screens ([type].tsx)
│   ├── items.tsx         # Consolidated view of all calculated items
│   ├── parties.tsx       # Party/Client management screen
│   └── _layout.tsx       # Root layout
├── constants/            # Core business logic and configuration
│   ├── api.ts            # Backend API configuration and endpoints
│   ├── colors.ts         # Theme and color definitions
│   ├── pdfGenerator.ts   # HTML-to-PDF generation logic
│   ├── storage.ts        # Local storage wrappers and data models
│   └── ThemeContext.tsx  # React context for Dark/Light mode
├── server/               # Node.js backend source code
├── app.json              # Expo configuration
└── package.json          # Dependencies and scripts
```

### Backend Architecture & Hosting
- **Database:** MongoDB Atlas (Cloud Database).
- **Backend Server:** Node.js / Express backend located in the `/server` directory.
- **Hosting Platform:** The backend is hosted live on **Render.com** for continuous deployment from the GitHub repository.
- **Connection:** The React Native app communicates with this live backend for syncing user reports and data.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation & Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Application:**
   ```bash
   npx expo start -c
   ```
   *Note: The `-c` flag clears the cache, which is recommended after config changes.*

3. **Testing on Device:**
   - Download the **Expo Go** app on your iOS or Android device.
   - Scan the QR code presented in your terminal.

4. **Testing on Web:**
   - Press `w` in the terminal to open the app in a web browser.
   - *Note: Some native features like PDF sharing (`expo-sharing`) are handled via browser print dialogs on the web.*

---

## 🛠️ Important Notes for Developers

- **File System Imports:** When dealing with the file system, always use `import * as FileSystem from 'expo-file-system/legacy'` to maintain compatibility with the current implementation.
- **React Compiler:** The `reactCompiler` experimental feature is intentionally disabled in `app.json` to prevent out-of-memory (`SIGTERM`) errors in the Jest worker during Web Bundling on Windows. **Do not re-enable it.**
- **Backend API:** The app defaults to offline-first mode via `AsyncStorage`. It checks for an `afi_token` to sync with the MongoDB backend. Ensure the backend URL in `constants/api.ts` is correct before pushing to production.
- **Web Compatibility:** The PDF generation (`pdfGenerator.ts`) has specific platform checks (`Platform.OS === 'web'`) to trigger `Print.printAsync` on web, as native sharing is unavailable in browsers.

---

## 📄 License
This project is proprietary. All rights reserved.
