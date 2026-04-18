# 🧬 AI Genomics Lab - Frontend

Next.js frontend for the AI Genomics Lab, providing real-time monitoring and management of genome indexing pipelines.

## Overview

The frontend provides an intuitive interface for:
- **Secure Authentication**: Login with JWT tokens, role-based access control
- **Settings Management**: Comprehensive platform configuration with permission-based access
- **Storage Integration**: MinIO object storage management for genome files
- Monitoring genome indexing progress in real-time
- Managing reference genome indices (index, re-index, delete)
- Viewing system infrastructure status
- Visualizing genomic data and analysis results

## Features

### 🔐 **Authentication & Settings Management**
- **Secure Login**: JWT-based authentication with token management
- **Role-Based Access**: Admin, analyst, researcher, viewer roles with appropriate permissions
- **Settings Dashboard**: Comprehensive configuration interface with 7 tabs
- **Permission Enforcement**: Granular control over who can edit each settings area
- **MinIO Storage Integration**: Connect to object storage for genome file management

### 🚀 **Real-time Genome Indexing Interface**
- **Live progress monitoring**: Server-Sent Events (SSE) streaming with auto-scrolling logs
- **Stage detection visualization**: Real-time display of pipeline stages (downloading, FASTA index, GZI index, Strobealign index)
- **Job tracking**: Persistent job IDs and status indicators
- **Timeout handling**: Extended connection timeouts for long-running operations

### 🗂️ **Genome Management**
- **Index status indicators**: Visual badges showing which genomes are indexed
- **Smart action buttons**: Dynamic buttons (Index/Re-index/Delete) based on current state
- **Delete confirmation**: Safe deletion of genome indices with user confirmation
- **Automatic status refresh**: Real-time updates after indexing/deletion operations

### 🖥️ **UI Components**
- **Settings Section**: Genome selection and pipeline configuration
- **Infrastructure Status**: Service connectivity indicators (Neo4j, PostgreSQL, MinIO, API)
- **Real-time Logs**: Auto-scrolling terminal-style output with colored status messages
- **Stage Indicators**: Visual progress bars and stage duration display

## Key Improvements (v2.0)

### 1. **Enhanced Real-time Monitoring**
- Auto-scrolling log container for continuous visibility
- Structured event parsing (job, stage, heartbeat, complete, error)
- Stage duration calculation and display
- Heartbeat handling to maintain SSE connections

### 2. **State Management**
- Persistent indexed status tracking via API endpoints
- Dynamic button states (disabled during operations, spinner indicators)
- Job ID tracking for debugging and monitoring
- Automatic status synchronization after operations

### 3. **User Experience**
- Visual feedback for indexed genomes (green badges, checkmarks)
- Clear action labels (Index → Re-index when already indexed)
- Confirmation dialogs for destructive operations
- Progress indicators for all async operations

## Component Structure

### `SettingsSection.tsx`
Main component for genome indexing management located at:
`/src/components/sections/SettingsSection/SettingsSection.tsx`

**Key Functions**:
- `handleIndexGenome()`: Initiates genome indexing with real-time streaming
- `handleDeleteIndex()`: Deletes genome indices with confirmation
- `handleCancelIndexing()`: Cancels ongoing indexing operations
- `refreshIndexedStatus()`: Fetches current indexing status from API

**State Management**:
- `indexedStatus`: Tracks which genomes are indexed
- `currentStage`: Current pipeline stage (downloading, creating_fai_index, etc.)
- `jobId`: Current job ID for tracking
- `isIndexing`/`isDeleting`: Operation progress indicators
- `indexLogs`: Real-time log messages with auto-scrolling

## API Integration

### Endpoints Used
- `GET /genome/indexed`: Fetch indexing status for all genomes
- `POST /genome/index`: Start genome indexing (SSE streaming)
- `DELETE /genome/index/{genome_id}`: Delete genome indices
- `GET /genome/jobs`: List all indexing jobs
- `GET /genome/job/{job_id}`: Get specific job details

### Event Types Handled
```typescript
interface ServerEvent {
  type: 'job' | 'stage' | 'heartbeat' | 'complete' | 'error' | 'log';
  // ... event-specific data
}
```

**Stage Mapping**:
- `initializing` → "Initializing"
- `downloading` → "Downloading genome"
- `creating_fai_index` → "Creating FASTA index"
- `creating_gzi_index` → "Creating GZI index"
- `creating_sti_index` → "Creating Strobealign index"
- `completed` → "Completed"

## Installation & Development

### Prerequisites
- Node.js 18+ and npm/yarn
- Running API backend (http://localhost:8000)

### Quick Start
```bash
cd frontend
npm install
npm run dev
```

The application will be available at http://localhost:3000

**Note**: Ensure the API backend is running (default: http://localhost:8000). On first startup, the database is automatically seeded with default admin credentials:
- **Email**: `admin@company.com`
- **Password**: `admin123`

### Environment Variables
Create `.env.local` in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Building for Production
```bash
npm run build
npm start
```

## Usage Guide

### Indexing a Genome
1. Select a reference genome from the dropdown
2. Click "Index" (or "Re-index" if already indexed)
3. Monitor real-time progress in the logs panel
4. Completion indicated by green "Indexed" badge

### Managing Existing Indices
- **Re-index**: Click "Re-index" to overwrite existing indices
- **Delete**: Click "Delete Index" to remove all index files
- **Status Check**: Green badge indicates indexed status

### Monitoring Progress
- **Job ID**: Unique identifier for tracking
- **Current Stage**: Active pipeline stage with duration
- **Live Logs**: Auto-scrolling terminal output
- **Stage Progress**: Visual indicators for each pipeline step

## Technical Details

### Real-time Event Handling
The frontend uses EventSource API to connect to Server-Sent Events (SSE) from the backend. Events are parsed and categorized for appropriate UI updates.

### State Synchronization
- Indexed status fetched on component mount
- Automatic refresh after index/delete operations
- Debounced updates to prevent excessive API calls

### Error Handling
- Network timeout handling (300s for initial connection)
- SSE reconnection attempts
- User-friendly error messages
- Operation cancellation support

## Performance Considerations

- **Auto-scroll optimization**: Uses React refs for efficient DOM access
- **Event throttling**: Heartbeat events filtered to prevent log spam
- **Memory management**: Log history limited to prevent memory leaks
- **Connection management**: AbortController for clean cancellation

## Troubleshooting

### Common Issues

1. **SSE Connection Timeout**
   - Increase timeout in `handleIndexGenome` (currently 300s)
   - Check API backend is running on port 8000
   - Verify CORS configuration in API

2. **Index Status Not Updating**
   - Check `/genome/indexed` endpoint response
   - Verify PostgreSQL connection in API
   - Refresh page to refetch initial status

3. **Real-time Logs Not Appearing**
   - Check browser console for SSE connection errors
   - Verify API is sending events correctly
   - Ensure auto-scroll is enabled (scrolls to bottom on new logs)

### Debugging
```javascript
// Enable detailed logging
console.log('SSE Event:', eventData);
// Check indexed status
console.log('Indexed Status:', indexedStatus);
```

## Related Components

- `Area`: Container component for sections
- `Button`: Custom button with spinner support
- `Select`: Dropdown for genome selection
- `Input`: Form input components

## Authentication & Settings

The frontend now includes secure authentication and comprehensive settings management:

### Login Page (`/login`)
- **User Authentication**: Email/password login with JWT token management
- **Session Management**: Automatic token refresh and logout functionality
- **Security Features**: Secure HTTP-only cookies, password hashing, CSRF protection
- **User Experience**: Form validation, error handling, remember me option

### Settings Page (`/settings`)
Organized into permission-based sections:

#### Genome References
- **Manage Reference Genomes**: Add, edit, delete genome references (admin only)
- **URL Validation**: Whitelisted domains, file extension validation, size checking
- **Test Connection**: Verify genome URL accessibility and integrity
- **Visual Status**: Active/inactive indicators and indexing status

#### Pipeline Configuration
- **Parameter Management**: Edit pipeline settings (admin only)
- **Validation**: Enum dropdowns, numeric ranges, required fields
- **Real-time Saving**: Save/cancel functionality with confirmation

#### AI Provider Settings
- **Provider Selection**: OpenRouter, OpenAI, Anthropic support
- **API Key Management**: Encrypted storage, masked display
- **Connection Testing**: Verify API keys and provider connectivity
- **Model Selection**: Choose appropriate LLM models for analysis

#### User Preferences
- **UI Customization**: Language, timezone, theme (light/dark/system)
- **Display Options**: Customize interface elements and layouts
- **User-specific**: Settings stored per user account

#### System Management (Admin Only)
- **Audit Logs**: Track configuration changes and user actions
- **System Health**: Monitor service status and connectivity
- **User Management**: Create, edit, and deactivate user accounts

#### Storage Management
- **MinIO Integration**: Connect to MinIO object storage for genome file management
- **Genome Sync**: Synchronize local genomes to MinIO storage
- **Status Tracking**: Monitor sync status for genome files
- **Download Management**: Download genomes from MinIO to local storage

### Security Implementation
- **Role-Based Access Control (RBAC)**: Admin, analyst, researcher, viewer roles
- **Permission Levels**: Granular control over who can edit each settings area
- **Input Validation**: Comprehensive validation for all user inputs
- **Password Security**: **Argon2** password hashing (modern, GPU/ASIC-resistant algorithm)
- **API Security**: JWT authentication, rate limiting, SQL injection prevention

### API Integration
- **Authentication Endpoints**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`
- **Settings Endpoints**: Genome references, pipeline settings, AI providers, UI preferences, audit logs, system health
- **Storage Endpoints**: `/storage/genomes`, `/storage/sync/genomes`, `/storage/genomes/{name}/status`, `/storage/genomes/{name}/download`
- **Real-time Updates**: SSE for system health monitoring
- **Error Handling**: Graceful degradation and user-friendly error messages

### Default Credentials & Database Bootstrap

When the application starts for the first time, the database is automatically seeded with:

**Default Admin User:**
- **Email**: `admin@company.com`
- **Password**: `admin123`
- **Roles**: `admin`, `analyst`, `researcher`, `viewer` (full permissions)

**Initial Configuration:**
- Pre-configured genome references (hg38, hg38-test, hg19)
- Default pipeline settings with validation rules
- Base roles and permission mappings
- System-wide UI preferences

**Database Initialization Process:**
1. PostgreSQL database `genomics` is created with all required tables
2. Tables for users, roles, genome references, pipeline settings, AI providers, UI preferences, and audit logs
3. Data seeding runs automatically on first API startup
4. Admin user is created with **Argon2-hashed password** (modern secure hashing)
5. All configurations are ready for immediate use

**Security Note:** The system uses **Argon2** for password hashing, which is currently the most secure password hashing algorithm, resistant to GPU and ASIC attacks.

### Getting Started with Authentication
1. **Initial Setup**: Database bootstrap creates admin user with credentials above
2. **First Login**: Navigate to `/login` and use `admin@company.com` / `admin123`
3. **Session Management**: JWT tokens automatically refresh; logout via `/logout`
4. **User Management**: Admin can create additional users with appropriate roles via Settings → User Management
5. **Configuration**: Set up genome references and pipeline parameters before analysis

For detailed implementation plan, see [PLAN.md](./PLAN.md).

## Future Enhancements

Planned improvements:
- Progress bar visualization for pipeline stages
- Historical job viewing and comparison
- Batch genome management operations
- Advanced filtering and search for logs
- Dark/light theme support
- Mobile-responsive design improvements
- Two-factor authentication
- OAuth2/OpenID Connect support
- Configuration versioning and import/export

## License

MIT License - See [LICENSE](../LICENSE) for details.

## Support

- GitHub Issues: https://github.com/rendergraf/AI-Genomics-Lab/issues
- Email: xavieraraque@gmail.com
- Author: Xavier Araque