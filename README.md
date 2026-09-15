# 🏸 Hostel Day Badminton Auction 2026

> **Live Player Auction • Hostel Day Celebration**
> A modern, responsive, full-stack badminton player auction system designed specifically for college hostel tournaments. Built with Next.js, Tailwind CSS, real-time synchronization, and projector-optimized display.

---

## 🌟 Key Features

- **Live Auction Arena & Projector Mode**:
  - High-contrast sports broadcast layout optimized for projectors and large displays.
  - Large player card with photo, roll number, department, year, playing style, and skill level.
  - Giant live bid board, leading franchise banner, and 30-second countdown clock that resets on every bid.
  - Real-time team purse meters with budget exhaustion indicators.
  - Instant One-Click Fullscreen Projector Mode (`⛶`).
- **Celebration & Stadium Sound Effects**:
  - Fullscreen **🎉 SOLD 🎉** celebration overlay with confetti explosions and fanfare.
  - Built-in Web Audio API synthesizer for stadium chimes, countdown ticks, and gavel thuds (zero external audio files or CORS issues).
  - Sound ON/OFF toggle switch (`🔊 / 🔇`).
- **Role-Based Access Control**:
  - **Admin**: Full control over bidding, player selection, pause/resume, SOLD, UNSOLD, undoing bids, team budgets, and resets.
  - **Viewer / Spectator**: Read-only live spectator experience for students and hostelites watching from mobile phones or laptops.
- **Franchise & Player Management**:
  - Unlimited teams with custom logos, captain tags, and initial purses.
  - Search, multi-filter (Branch, Year, Singles/Doubles, Skill Level, Status), and sorting.
  - Detailed player cards with individual auction bid history.
  - Dedicated team squad pages.
- **Google Sheets & Google Form Synchronization**:
  - Flexible column mapping layer designed for Google Form response sheets.
  - Dual sync mode: Supports direct "Publish to Web" CSV URL (zero-config, no GCP account needed!) and Google Service Account API (`GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`).
  - Interactive "Sync Google Sheet" modal with Append or Replace modes.
- **Real-Time Multi-Device Architecture**:
  - Powered by Server-Sent Events (SSE) `/api/auction/stream` and persistent atomic JSON storage on the server.
  - Changes made by the Admin laptop are broadcast instantly to projectors and spectator devices without page refreshing.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18 or higher (v20+ recommended)
- **npm** or **yarn** / **pnpm**

### 2. Installation
```bash
# Navigate to project directory
cd badminton-auction

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🔑 Admin Credentials (Demo)

| Field | Value |
|---|---|
| **Login URL** | `http://localhost:3000/login` |
| **Username** | `admin` |
| **Password** | `hostel2026` |

*You can also click **"Continue as Viewer"** on the login screen to enter read-only spectator mode.*

To customize credentials, edit `.env.local`:
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
```

---

## 📋 How to Conduct a Test Auction (Step-by-Step)

1. **Log in as Admin**:
   - Go to `http://localhost:3000/login`, enter `admin` / `hostel2026`, and click **Admin Login**.
2. **Open the Live Arena**:
   - Navigate to **🏸 Live Auction** (`/admin/live`).
   - If projecting on a screen, click **Projector Mode** in the top-right corner to go fullscreen.
3. **Select a Player & Start Bidding**:
   - By default, the first player in the queue (e.g. *Sai Krishna*) is ready.
   - Click **Start Auction**. The status turns **LIVE** and the 30-second timer begins ticking.
4. **Place Bids for Teams**:
   - At the bottom of the screen, click the **+ BID ₹X** button under any team card (e.g. *Smash Warriors*).
   - The current bid increases, the team is set as the leader, and the timer automatically resets to 30 seconds.
   - Click another team (e.g. *Shuttle Kings*) to simulate a bidding war.
   - Teams without sufficient purse remaining are automatically disabled from bidding.
5. **Mark Player SOLD**:
   - When bidding concludes, click **SOLD!**.
   - A celebration screen explodes with golden confetti and victory fanfare.
   - The final price is automatically deducted from the winning team's purse, and the player is added to their squad.
   - Click **Next Player in Queue** to immediately advance to the next player!
6. **Mark Player UNSOLD**:
   - If no team bids on a player, click **UNSOLD**. The player is marked Unsold with no budget deductions.
7. **Mistake? Use Undo**:
   - If an accidental bid is placed, click **Undo** in the control bar to revert to the previous bid.

---

## 📑 Google Sheets & Google Form Setup Guide

The application is built to seamlessly sync player registrations collected via Google Forms.

### Step 1: Create Your Google Form
Create a registration form with the following fields:
1. **Player Name** (Short answer)
2. **Roll Number** (Short answer)
3. **Branch** (Dropdown or Short answer: CSE, ECE, MECH, CIVIL, IT, AI&DS, etc.)
4. **Year** (Dropdown: 1st, 2nd, 3rd, 4th)
5. **Gender** (Multiple choice: Male, Female)
6. **Playing Type** (Multiple choice: Singles, Doubles, Both)
7. **Skill Level** (Multiple choice: Beginner, Intermediate, Advanced)
8. **Base Price** (Number: e.g. 300, 500)
9. **Player Photo** (Optional file upload or image link)

### Step 2: Open the Linked Google Sheet
1. In your Google Form, click the **Responses** tab and click **Link to Sheets**.
2. A Google Sheet will open containing all registered responses.

### Step 3: Connect via Zero-Config CSV Sync (Easiest Method)
You do **not** need a Google Cloud account to sync!
1. In your Google Sheet, click **File > Share > Publish to the web**.
2. Under "Link", change "Entire Document" to your responses sheet, and change "Web page" to **Comma-separated values (.csv)**.
3. Click **Publish** and copy the generated link.
4. In the Badminton Auction app, go to **👥 Players** (`/admin/players`) and click **Sync Google Sheet**.
5. Paste the link into the **Google Sheet ID or Published CSV URL** field and click **Sync Now**.
6. All registered players are imported into the auction database!

### Step 4: (Optional) Google Service Account Integration
If you prefer private Google Cloud Service Account API access:
1. Create a Service Account in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Google Sheets API**.
3. Create a JSON key and download it.
4. Share your Google Sheet with the Service Account email (Viewer permission).
5. Open `.env.local` and add:
   ```env
   GOOGLE_SHEET_ID=your_sheet_id_from_url
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

---

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript (Strict typing)
- **Styling**: Tailwind CSS (Sports tournament theme with dark athletic aesthetic)
- **Icons**: Lucide React
- **Animations & Effects**: Canvas Confetti, Web Audio API Sound Synthesizer
- **Database & Persistence**: Server-side atomic JSON database store (`src/data/auction-db.json`)
- **Real-Time Streaming**: Server-Sent Events (SSE) `/api/auction/stream`

---

## 🌐 Deployment Guide

### Option 1: Vercel (Recommended - One Click)
1. Push this project to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Add environment variables:
   - `ADMIN_USERNAME`: `admin`
   - `ADMIN_PASSWORD`: `your_password`
   - `NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL`: (Optional sheet link)
5. Click **Deploy**. Your auction website is live worldwide!

### Option 2: Local Hostel WiFi Network (No Internet Needed!)
You can run the auction completely offline on the hostel router:
1. Start the server on the admin laptop:
   ```bash
   npm run dev -- -H 0.0.0.0
   ```
2. Find your laptop's local IP address (e.g. `192.168.1.45` via `ipconfig`).
3. Connect the projector laptop and audience phones to the same hostel Wi-Fi and open:
   ```
   http://192.168.1.45:3000
   ```
4. The Admin operates the auction from their laptop while the projector display and viewers receive real-time updates over the local network!

---

## 🏆 Default Franchise Teams

1. **Smash Warriors** — Captain: Sai Teja (Block A) — Budget: ₹10,000
2. **Shuttle Kings** — Captain: Anurag Sharma (Block B) — Budget: ₹10,000
3. **Net Ninjas** — Captain: Karthik Reddy (Block C) — Budget: ₹10,000
4. **Drop Shotters** — Captain: Rohan Verma (Block D) — Budget: ₹10,000
5. **Racquet Royals** — Captain: Vikram Singhania (Block A) — Budget: ₹10,000
6. **Court Champions** — Captain: Goutham Krishna (Block B) — Budget: ₹10,000

---

## 📄 License

Created for **Hostel Day Celebration 2026**. Free to customize and distribute for college sporting events!
