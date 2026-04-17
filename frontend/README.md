# 🧬 AI Genomics Lab - Frontend

Next.js frontend for the AI Genomics Lab, providing real-time monitoring and management of genome indexing pipelines.

## Overview

The frontend provides an intuitive interface for:
- Monitoring genome indexing progress in real-time
- Managing reference genome indices (index, re-index, delete)
- Viewing system infrastructure status
- Visualizing genomic data and analysis results

## Features

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

## Future Enhancements

Planned improvements:
- Progress bar visualization for pipeline stages
- Historical job viewing and comparison
- Batch genome management operations
- Advanced filtering and search for logs
- Dark/light theme support
- Mobile-responsive design improvements

## License

MIT License - See [LICENSE](../LICENSE) for details.

## Support

- GitHub Issues: https://github.com/rendergraf/AI-Genomics-Lab/issues
- Email: xavieraraque@gmail.com
- Author: Xavier Araque