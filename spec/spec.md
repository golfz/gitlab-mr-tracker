# GitLab Merge Request Status Tracker - Specification

## 1. Project Overview

A single-page web application for tracking the latest status of GitLab merge requests. The application is a standalone React.js application that stores all data locally (no backend required) and can be built as a static website.

### 1.1 Objectives
- Track multiple GitLab merge requests in real-time
- Display merge request status, author, reviewers, and approvers
- Auto-refresh to keep data up-to-date
- Store configuration and data locally in the browser

## 2. Technical Stack

- **Frontend Framework**: React.js
- **Styling**: Tailwind CSS
- **Build Tool**: Vite or Create React App (recommended: Vite)
- **Storage**: Browser LocalStorage
- **API**: GitLab REST API
- **Deployment**: Static website (can be hosted on any static hosting service)

## 3. Architecture

### 3.1 Application Structure
- Single Page Application (SPA)
- Client-side only (no backend server)
- All data persisted in browser LocalStorage
- Direct API calls to GitLab from the browser

### 3.2 Data Storage
- **Configuration**: Stored in LocalStorage
  - GitLab host URL
  - Private access token
  - Auto-refresh interval (in seconds/minutes)
  - My account username
  - Team member usernames
- **Merge Requests**: Stored in LocalStorage
  - Array of MR objects with metadata
  - Last updated timestamp
- **Hidden MRs**: Stored in LocalStorage
  - Array of MR IDs that are hidden
- **Status Filters**: Stored in LocalStorage
  - Object with status visibility flags
- **MR Read Timestamps**: Stored in LocalStorage
  - Object mapping MR ID to last read timestamp
  - Used to detect new comments since last read

## 4. Data Models

### 4.1 Configuration Object
```typescript
interface AppConfig {
  gitlabHost: string;        // e.g., "https://gitlab.com"
  accessToken: string;        // Private access token
  autoRefreshInterval: number; // in seconds, e.g., 60
  myAccount: string;          // My GitLab username (e.g., "@myname")
  teamAccounts: string[];      // Team member usernames (e.g., ["@teammate1", "@teammate2"])
  fetchTimeUnit: 'days' | 'weeks'; // Unit for fetch time limit
  fetchTimeValue: number;     // Fetch time limit value (max 90 for days, max 12 for weeks)
  fetchClosedMRs: boolean;    // Whether to fetch closed/rejected MRs (default: false)
}
```

### 4.2 Merge Request Object
```typescript
interface MergeRequest {
  id: string;                // Unique identifier (MR URL or hash)
  url: string;               // Full GitLab MR URL
  projectId: number;         // GitLab project ID
  iid: number;               // Merge request IID
  title: string;             // MR title
  repository: string;        // Repository name (e.g., "group/project")
  status: MRStatus;          // Current status
  statusUpdatedAt: string;   // ISO timestamp of last status change
  author: Author;            // MR author/creator
  reviewers: Reviewer[];     // List of reviewers
  approvers: Approver[];     // List of approvers
  lastFetchedAt: string;     // ISO timestamp of last API fetch
  createdAt: string;         // ISO timestamp when MR was added
  latestCommentAt?: string;  // ISO timestamp of the latest comment/note
}

interface Author {
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
}

interface Reviewer {
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
}

interface Approver {
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
}

enum MRStatus {
  COMMENTED = 'commented',      // 💬 Has comments but not approved
  APPROVED = 'approved',        // ✅ Approved
  REJECTED = 'rejected',        // ⛔ Rejected
  MERGED = 'merged'             // 🎉 Merged
}
```

## 5. Features

### 5.1 Add Merge Request
- **Input**: Text box labeled "Add Custom MR" (separate from auto-subscribed MRs)
- **Validation**: 
  - Must be a valid GitLab merge request URL
  - Must not be a duplicate (same URL already exists)
- **Action**: 
  - Parse URL to extract project and MR IID
  - Fetch MR data from GitLab API
  - Add to local storage
  - Display in "Other MRs" table
  - These MRs are manually added and not part of auto-subscription

### 5.1.1 Auto-Subscribe to Account MRs
- **Trigger**: When configuration is saved with account usernames
- **Action**:
  - Fetch merge requests for "My Account" from GitLab API within the configured fetch time limit
  - Fetch merge requests for each "Team Account" from GitLab API within the configured fetch time limit
  - Only MRs created within the fetch time window are fetched (e.g., last 2 weeks)
  - MR states fetched:
    - Always: opened and merged MRs
    - Conditionally: closed/rejected MRs (only if "Fetch Closed MRs" is enabled)
  - Add/update MRs in local storage
  - Categorize MRs automatically:
    - My MRs: Author matches "My Account"
    - Team MRs: Author matches any "Team Account"
  - Auto-refresh will keep these MRs up-to-date
- **API Endpoint**: 
  - `GET /api/v4/merge_requests?author_username={username}&scope=all&created_after={date}&state={states}`
  - `created_after` parameter is calculated based on fetch time limit (e.g., 2 weeks ago)
  - `state` parameter: 
    - If "Fetch Closed MRs" is enabled: fetches all states (opened, merged, closed)
    - If "Fetch Closed MRs" is disabled: only fetches opened and merged states
  - The `scope=all` parameter fetches MRs across all projects the user has access to

### 5.2 Configuration Modal
- **Trigger**: Config button (gear icon or similar)
- **Fields**:
  - GitLab Host (text input, default: "https://gitlab.com")
  - Private Access Token (password input)
  - Auto-refresh Interval (number input, unit: seconds, default: 60)
  - My Account (text input, e.g., "@myname")
  - Team Accounts (text input with add/remove buttons, e.g., "@teammate1", "@teammate2")
  - Fetch Time Limit:
    - Unit selector: Days or Weeks (radio buttons or dropdown)
    - Value input: Number input
    - Default: 2 weeks
    - Validation:
      - Days: Maximum 90 days, minimum 1 day
      - Weeks: Maximum 12 weeks, minimum 1 week
    - Required field
  - Fetch Closed MRs: Checkbox (default: unchecked)
    - When checked: Fetches closed/rejected MRs in addition to opened and merged
    - When unchecked: Only fetches opened and merged MRs
- **Actions**:
  - Save: Store in LocalStorage
  - Cancel: Close without saving
  - Export Config: Download configuration as JSON file
  - Import Config: Upload and load configuration from JSON file
  - Auto-subscribe: When saved, automatically fetch all MRs from configured accounts (within fetch time limit)
- **Validation**: 
  - GitLab host must be a valid URL
  - Access token must not be empty
  - Auto-refresh interval must be positive number
  - Fetch time limit is required
  - Fetch time value must be within allowed range based on unit
  - Account usernames should start with "@" (optional but recommended)

### 5.3 Merge Request Table

#### 5.3.1 Table Columns

**Merge Request Column**
- **Top Row**: 
  - MR title (clickable link, opens in new tab)
  - Styled as link/button
  - When clicked: Updates "last read" timestamp for that MR (stored in LocalStorage)
- **Bottom Row**: 
  - Repository name
  - MR ID (IID)
  - Time ago (relative time, e.g., "2 hours ago")

**Status Column**
- **Display**: 
  - Emoji indicator:
    - 💬 Commented (has comments, not approved)
    - ✅ Approved
    - ⛔ Rejected
    - 🎉 Merged
  - Time ago (when status was last updated)
  - **New Comments Indicator**: 
    - Small blue dot/badge appears when there are new comments since last read
    - Shown as a small circular badge (🔵) next to the status emoji
    - Only visible when latest comment timestamp is after the last read timestamp
    - Clicking on the MR title updates the last read timestamp
    - "New" text badge also appears next to the status label
- **Tooltip**: Full status text on hover

**Author Column**
- **Display**: 
  - Circular avatar image
  - Single author (the MR creator)
- **Interaction**: 
  - Hover tooltip shows full name and username
  - Format: "Name (@username)"

**Reviewer Column**
- **Display**: 
  - Circular avatar images in a row
  - Maximum visible avatars (e.g., 5), show "+N more" if more
- **Interaction**: 
  - Hover tooltip shows full name and username
  - Click to view profile (optional)

**Approver Column**
- **Display**: 
  - Circular avatar images in a row
  - Maximum visible avatars (e.g., 5), show "+N more" if more
- **Interaction**: 
  - Hover tooltip shows full name and username
  - Click to view profile (optional)

**Action Column**
- **Hide Button**: 
  - Eye-slash icon or "Hide" button
  - Hides MR from view (stored in LocalStorage)
  - MR remains in storage but is not displayed
- **Delete Button**: 
  - Trash icon or "Delete" button
  - Confirmation dialog before deletion
  - Removes MR from LocalStorage and table

#### 5.3.2 Table Behavior
- **Sorting**: By created time (newer first)
- **Table Organization**:
  - **My MRs Table**: Shows MRs where author matches configured "My Account"
  - **Team MRs Table**: Shows MRs where author matches any configured "Team Account"
  - **Other MRs Table**: Shows manually added MRs that don't match my account or team accounts
  - Tables displayed in order: My MRs → Team MRs → Other MRs
- **Filter Controls** (above tables):
  - **Show/Hide Hidden**: Toggle button to show or hide MRs that have been hidden
  - **Status Checkboxes**: Checkboxes for each status (💬 Commented, ✅ Approved, ⛔ Rejected, 🎉 Merged)
    - Unchecked statuses are hidden from all tables
    - State persisted in LocalStorage
    - **Dynamic Behavior**:
      - When "Fetch Closed MRs" is disabled: 
        - "Rejected" checkbox is automatically unchecked and disabled (since rejected MRs are not fetched)
        - "Merged" checkbox is automatically unchecked and disabled (merged MRs are not fetched when this option is disabled)
      - When "Fetch Closed MRs" is enabled: All status checkboxes are enabled and can be toggled
- **Responsive**: 
  - On mobile: Stack columns or use card layout
  - On desktop: Full table view
- **Empty State**: Show message when no MRs are added or all are filtered out

### 5.4 Auto-Refresh
- **Background Updates**: 
  - Fetch latest data from GitLab API at configured interval
  - Update table without full page refresh
  - Show loading indicator during fetch
- **Last Updated Display**: 
  - Show timestamp of last successful update
  - Format: "Last updated: 2 minutes ago" or absolute time
- **Error Handling**: 
  - Show error message if API call fails
  - Retry on next interval
  - Don't clear existing data on error

### 5.5 Manual Refresh
- **Refresh Button**: Optional manual refresh button
- **Action**: Immediately fetch latest data for all MRs

## 6. UI/UX Specifications

### 6.1 Design Principles
- Clean, modern design
- Minimalist interface
- Professional appearance
- Good contrast and readability

### 6.2 Layout
- **Header Section**:
  - Text input for MR URL (full width on mobile, centered with max-width on desktop)
  - Config button (top right)
  - Last updated timestamp (below input or in header)
- **Main Content**:
  - Table/card view of merge requests
  - Responsive: Cards on mobile, table on desktop
- **Width Constraints**: 
  - Maximum width: 1200px (centered on large screens)
  - Padding: 16px on mobile, 24px on desktop

### 6.3 Responsive Breakpoints
- **Mobile**: < 768px (stack layout, cards)
- **Tablet**: 768px - 1024px (table with adjusted columns)
- **Desktop**: > 1024px (full table layout)

### 6.4 Color Scheme
- Light theme (default)
- Consider dark mode support (optional)
- Use Tailwind CSS default color palette

### 6.5 Typography
- Clear, readable font (system font stack or Inter/Roboto)
- Heading sizes for hierarchy
- Monospace for timestamps/codes

### 6.6 Interactive Elements
- Buttons: Clear hover and active states
- Links: Underline on hover
- Avatars: Slight scale on hover
- Tooltips: Smooth fade-in animation

## 7. GitLab API Integration

### 7.1 Required API Endpoints

**Get Merge Request**
```
GET /api/v4/projects/:id/merge_requests/:merge_request_iid
Headers: PRIVATE-TOKEN: {access_token}
```

**Get Merge Request Approvals**
```
GET /api/v4/projects/:id/merge_requests/:merge_request_iid/approvals
Headers: PRIVATE-TOKEN: {access_token}
```

**Get Merge Request Notes/Comments**
```
GET /api/v4/projects/:id/merge_requests/:merge_request_iid/notes
Headers: PRIVATE-TOKEN: {access_token}
```

**Get Project Members (for reviewers)**
```
GET /api/v4/projects/:id/members
Headers: PRIVATE-TOKEN: {access_token}
```

**Get Merge Requests by Author (for auto-subscribe)**
```
GET /api/v4/merge_requests?author_username={username}&scope=all
Headers: PRIVATE-TOKEN: {access_token}
```

Note: 
- The `scope=all` parameter fetches MRs across all projects the user has access to
- No `state` filter is applied, so it fetches all MR states (opened, merged, closed) to include merged MRs
- Status filters in the UI can be used to show/hide specific statuses

### 7.2 Status Determination Logic

1. **Merged**: `state === 'merged'`
2. **Rejected**: `state === 'closed'` and not merged
3. **Approved**: Has approvals and `state === 'opened'`
4. **Commented**: Has notes/comments but not approved and `state === 'opened'`

### 7.3 Error Handling
- **401 Unauthorized**: Invalid or expired token
- **404 Not Found**: MR doesn't exist or no access
- **429 Rate Limited**: Wait and retry
- **Network Error**: Show error message, keep existing data

## 8. Implementation Details

### 8.1 URL Parsing
Parse GitLab MR URL format:
- `https://{host}/{group}/{project}/-/merge_requests/{iid}`
- Extract: host, group, project (project path), iid

### 8.2 Project ID Resolution
- Option 1: Use project path directly in API calls (URL-encoded)
- Option 2: Fetch project ID from project path first

### 8.3 Time Formatting
- Use relative time library (e.g., `date-fns` or `dayjs`)
- Format: "2 hours ago", "3 days ago", etc.
- Fallback to absolute time for very old items

### 8.4 Avatar Handling
- Use GitLab avatar URLs
- Fallback to initials or default avatar if missing
- Lazy load images

## 9. Build & Deployment

### 9.1 Build Configuration
- Production build generates static files
- All assets bundled and optimized
- No external dependencies at runtime (except GitLab API)

### 9.2 Environment
- No environment variables required (all config in UI)
- Can be hosted on:
  - GitHub Pages
  - Netlify
  - Vercel
  - Any static hosting service

### 9.3 Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ support required
- LocalStorage support required

## 10. Code Quality Requirements

### 10.1 Code Standards
- **TypeScript**: Recommended for type safety
- **ESLint**: Configured with React best practices
- **Prettier**: Code formatting
- **Component Structure**: 
  - Functional components with hooks
  - Separation of concerns
  - Reusable components

### 10.2 Project Structure
```
src/
  components/
    MRTable/
    MRRow/
    ConfigModal/
    AddMRInput/
    Avatar/
    StatusBadge/
  hooks/
    useMRData/
    useConfig/
    useAutoRefresh/
  services/
    gitlabApi/
    storage/
  utils/
    urlParser/
    timeFormatter/
  types/
    index.ts
  App.tsx
  index.tsx
```

### 10.3 Best Practices
- Error boundaries for error handling
- Loading states for async operations
- Optimistic updates where appropriate
- Memoization for expensive computations
- Proper cleanup in useEffect hooks

## 11. Testing Considerations

### 11.1 Unit Tests
- URL parsing logic
- Status determination logic
- Time formatting utilities
- LocalStorage operations

### 11.2 Integration Tests
- API integration (with mock data)
- Component interactions
- Form validations

### 11.3 Manual Testing Checklist
- Add MR with valid URL
- Add MR with invalid URL (error handling)
- Configure settings
- Delete MR
- Auto-refresh functionality
- Responsive design on different screen sizes
- LocalStorage persistence across page reloads

## 12. Future Enhancements (Optional)

- Dark mode toggle
- Filter and search functionality
- Export/import configuration
- Multiple GitLab instance support
- Notification support (browser notifications)
- MR grouping by project
- Custom status colors/themes

