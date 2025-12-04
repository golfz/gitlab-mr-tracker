# GitLab Merge Request Tracker

A single-page web application for tracking the latest status of GitLab merge requests. Built with React.js, TypeScript, and Tailwind CSS.

## Features

- 📊 Track multiple GitLab merge requests in real-time
- 🔄 Auto-refresh to keep data up-to-date
- 👥 Auto-subscribe to your and your team's MRs
- 🎯 Filter by status (Commented, Approved, Rejected, Merged)
- 👁️ Hide/show MRs as needed
- ⏰ Configurable fetch time limit (days/weeks)
- 🚫 Option to exclude closed/rejected MRs
- 💾 All data stored locally in browser (no backend required)
- 📱 Responsive design (mobile, tablet, desktop)
- ⚙️ Configurable GitLab host and access token
- 🎨 Clean, modern UI

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## Usage

1. **Configure GitLab Access**
   - Click the ⚙️ (gear) icon in the top right
   - Enter your GitLab host (e.g., `https://gitlab.com`)
   - Enter your GitLab private access token
   - Set the auto-refresh interval (in seconds)
   - Configure your account and team accounts for auto-subscription
   - Set fetch time limit (how far back to fetch MRs)
   - Optionally enable "Fetch Closed MRs" to include closed/rejected MRs
   - Click "Save"

2. **Add Merge Requests**
   - Paste a GitLab merge request URL in the input box
   - Click "Add" or press Enter
   - The merge request will appear in the table below

3. **View Status**
   - 💬 Commented: Has comments but not approved
   - ✅ Approved: Has been approved
   - ⛔ Rejected: Has been closed/rejected
   - 🎉 Merged: Has been merged

4. **Manage Merge Requests**
   - Click on a merge request title to open it in a new tab
   - Hover over avatars to see reviewer/approver names
   - Click the 🗑️ icon to remove a merge request from the list
   - Click the 🔄 Refresh button to manually update all merge requests

## Creating a GitLab Access Token

1. Go to your GitLab instance
2. Navigate to **Settings** → **Access Tokens**
3. Create a new token with the following scopes:
   - `api` (full API access)
   - `read_api` (read-only API access, minimum required)
4. Copy the token and paste it into the configuration modal

## Project Structure

```
src/
  components/     # React components
  hooks/          # Custom React hooks
  services/       # API and storage services
  types/          # TypeScript type definitions
  utils/          # Utility functions
  App.tsx         # Main application component
  main.tsx        # Application entry point
```

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **date-fns** - Date/time formatting
- **GitLab REST API** - Data source

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires ES6+ and LocalStorage support.

## License

MIT

