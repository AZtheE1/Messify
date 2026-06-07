# Messify 🌟

> A Premium, Production-Ready, Offline-First Progressive Web Application (PWA) for Hostel & Mess Expense and Meal Management. 

Messify is designed with a zero-build toolchain philosophy, utilizing pure HTML5, CSS3 (Vanilla), and ES6+ JavaScript. It integrates seamlessly with Firebase v10 services via CDN to deliver a fast, responsive, and secure experience for hostel members and managers alike.

---

## 🚀 Key Features

* **Offline-First Architecture**: Powered by native Service Workers and the Cache API to ensure functional continuity even under poor network conditions.
- **Dynamic Dashboard**: Responsive UI detailing total deposits, expenditures, real-time balance calculations, and user-specific due status.
- **Shopper Contribution Chart**: Interactive visual metrics showing shopper contributions via Chart.js.
- **Multi-Step Bazar Log Wizard**: Multi-step wizard layout for adding categorized line items for bazar transactions.
- **Calculations Engine**: Handles on-the-fly calculations for overall balance, meal rates, individual dues, and overrides.
- **Auto-Month Close**: Automated system validating date changes to close cycles, calculate final arrears, and roll over to a new active cycle.
- **Admin Control Panel**: Fine-grained member management, pending log request queue approvals, deposit entries, and manual cycle overrides.
- **Instant PDF Exports**: Client-side, print-friendly monthly reconciliation PDF exports powered by `html2pdf.js`.

---

## 🛠️ Technical Stack

| Concern | Technology / Service | Source / CDN |
| :--- | :--- | :--- |
| **Core UI / Styling** | HTML5 + CSS3 (Glassmorphism & HSL variables) | Native |
| **Database** | Firebase Firestore v10 | gstatic CDN |
| **Authentication** | Firebase Authentication (Google Sign-In) | gstatic CDN |
| **Charts & Graphs** | Chart.js v4 | jsDelivr CDN |
| **Offline Cache** | Service Worker Cache API | Native |
| **PDF Rendering** | html2pdf.js | cdnjs |
| **Notifications** | SweetAlert2 | jsDelivr CDN |
| **Fonts** | Google Fonts (Sora & DM Mono) | fonts.googleapis |

---

## 📂 Directory Layout

```
messify/
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD pipeline for automated deployments
├── css/
│   └── styles.css          # Core design tokens, light/dark theme variables, transitions
├── js/
│   ├── app.js              # Application entry, SPA router, environment config loader
│   ├── auth.js             # Auth handlers, Google Login, Role-Based Access Control
│   ├── db.js               # Real-time listeners, Firestore actions, calculations
│   ├── charts.js           # Chart.js initialization and updates
│   └── reports.js          # PDF report generator template and builder
├── .env.example            # Environment variables placeholder reference
├── firestore.rules         # Declarative Firebase security rules
├── index.html              # Main SPA HTML structure
├── manifest.json           # PWA metadata configuration
└── sw.js                   # Service worker caching strategy
```

---

## ⚙️ Setup & Deployment Guide

### 1. Local Configuration

1. Copy `.env.example` to create your own configuration file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your unique Firebase App config keys:
   ```env
   FIREBASE_API_KEY="AIzaSy..."
   FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
   FIREBASE_PROJECT_ID="your-app"
   FIREBASE_STORAGE_BUCKET="your-app.firebasestorage.app"
   FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
   FIREBASE_APP_ID="your-app-id"
   ```

### 2. Deployment to GitHub Pages (Automated CI/CD)

This project is configured with a GitHub Actions workflow (`.github/workflows/deploy.yml`) to securely inject your Firebase credentials at build time without exposing them in your repository history.

1. **Add Secrets**: In your GitHub Repository, go to **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**. Add each parameter from your `.env` file (e.g., `FIREBASE_API_KEY`, `FIREBASE_PROJECT_ID`, etc.).
2. **Permissions**: Go to **Settings** -> **Actions** -> **General** -> **Workflow permissions**, and choose **Read and write permissions**. Save your settings.
3. **Trigger Build**: Push your code to the `main` branch. The action will automatically deploy your code, package the `.env` file, and publish it to the `gh-pages` branch.
4. **Activate Pages**: Go to **Settings** -> **Pages**, set the Source branch to `gh-pages` and save.

---

## 🔒 Security & Firestore Rules

Production-ready Firestore rules are included in the root directory under `firestore.rules`. Deploy rules to secure authorization checks via the Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

---

## 👤 First-Time Admin Configuration

1. Ensure the `members` collection in Firestore is empty.
2. The very first user who authenticates using Google Sign-In will automatically be assigned the `admin` role.
3. Subsequent registrants will be given the default read-only `member` role. Administrators can change member statuses and roles directly inside the Admin control panel.

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
