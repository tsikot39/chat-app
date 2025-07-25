# NexusChat - Real-Time Messaging Platform

A modern, responsive, and secure real-time chat application built with Next.js, MongoDB, and NextAuth.js.

## Features

- **Google OAuth Authentication** - Secure sign-in with Google accounts
- **Real-time Messaging** - Instant message delivery with Socket.io WebSocket communication
- **User Management** - Search and discover other users with privacy controls
- **One-on-One Conversations** - Direct messaging between users
- **Privacy Controls** - Control who can message you (everyone, contacts only, or nobody)
- **Message History** - Persistent message storage with automatic cleanup based on user preferences
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Modern UI** - Clean interface built with Shadcn/UI and Tailwind CSS with consistent branding
- **Comprehensive Testing** - Unit tests with Jest & React Testing Library, E2E tests with Cypress
- **Performance Monitoring** - Real-time performance tracking and optimization
- **Error Tracking** - Sentry integration for production error monitoring
- **Structured Logging** - Winston logging with file rotation and multiple levels
- **Production Ready** - Complete testing, monitoring, and deployment infrastructure

## Tech Stack

- **Frontend**: Next.js 15 with App Router, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn/UI components
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with Google OAuth
- **Real-time**: Socket.io for WebSocket communication
- **Validation**: Zod for schema validation
- **Date Handling**: date-fns for date formatting
- **Testing**: Jest, React Testing Library, Cypress for E2E testing
- **Monitoring**: Sentry for error tracking, Winston for server logging
- **Performance**: Custom performance monitoring, virtual scrolling, lazy loading

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or MongoDB Atlas)
- Google OAuth credentials

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd chat-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the `.env.example` file to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   Update the following variables in `.env.local`:

   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/nexuschat
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nexuschat

   # NextAuth Configuration
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000

   # Google OAuth Configuration
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Set up Google OAuth**

   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add `http://localhost:3000` to authorized origins
   - Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs
   - Copy the Client ID and Client Secret to your `.env.local` file

5. **Start MongoDB**

   If using local MongoDB:

   ```bash
   mongod
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js authentication
│   │   ├── conversations/ # Conversation management
│   │   ├── messages/      # Message handling & cleanup
│   │   ├── users/         # User management & status
│   │   └── socket/        # Socket.io configuration
│   ├── auth/              # Authentication pages
│   ├── settings/          # User settings page
│   └── page.tsx           # Main application page
├── __tests__/             # Test files
│   ├── components/        # Component unit tests
│   └── api/              # API route tests
├── components/            # React components
│   ├── chat/             # Chat-specific components
│   │   ├── ChatWindow.tsx      # Main chat interface
│   │   ├── ConversationList.tsx # Conversation sidebar
│   │   ├── UserList.tsx        # User discovery
│   │   └── ReadReceipt.tsx     # Read receipt indicators
│   ├── ui/               # Reusable UI components
│   │   ├── VirtualScroll.tsx   # Performance optimization
│   │   └── LazyLoading.tsx     # Lazy loading utilities
│   └── Providers.tsx     # Application providers
├── hooks/                # Custom React hooks
│   ├── useSocket.ts      # Socket.io integration
│   ├── useUserSettings.ts # User preferences
│   ├── useReadReceipts.ts # Read receipt management
│   └── useUnreadCounts.ts # Unread message tracking
├── lib/                  # Utility functions
│   ├── mongodb.ts        # Database connection
│   ├── auth.ts          # Authentication utilities
│   ├── performance.ts    # Performance monitoring
│   └── logger.ts        # Winston logging
├── models/               # MongoDB/Mongoose models
│   ├── User.ts          # User schema with settings
│   ├── Conversation.ts   # Conversation schema
│   └── Message.ts       # Message schema
├── schemas/              # Zod validation schemas
└── types/                # TypeScript type definitions

cypress/
├── e2e/                  # End-to-end tests
├── component/            # Component tests
└── support/              # Cypress support files

# Configuration Files
├── jest.config.js        # Jest testing configuration
├── jest.setup.js         # Jest setup and mocks
├── cypress.config.ts     # Cypress configuration
├── sentry.client.config.ts # Sentry client config
├── sentry.server.config.ts # Sentry server config
├── sentry.edge.config.ts   # Sentry edge config
└── PRODUCTION_READY.md    # Production setup guide
```

## API Routes

### Authentication

- `POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Users

- `GET /api/users` - Get all users (with optional search)

### Conversations

- `GET /api/conversations` - Get user's conversations
- `POST /api/conversations` - Create new conversation

### Messages

- `GET /api/messages` - Get messages for a conversation (respects user's message history setting)
- `POST /api/messages` - Send a new message
- `GET /api/messages/cleanup` - Get message cleanup statistics
- `POST /api/messages/cleanup` - Manually trigger message cleanup based on user settings
- `GET /api/messages/cleanup/global` - Global cleanup for all users (admin endpoint)
- `POST /api/messages/read` - Mark messages as read
- `GET /api/socket` - Socket.io configuration endpoint

### User Management

- `GET /api/users/status` - Update user online status and last seen timestamp

## Database Schema

### User

- `email` - Unique email address
- `name` - User's display name
- `image` - Profile picture URL
- `isOnline` - Online status
- `lastSeen` - Last activity timestamp

### Conversation

- `participants` - Array of user IDs
- `lastMessage` - Reference to last message
- `lastMessageAt` - Timestamp of last message

### Message

- `conversationId` - Reference to conversation
- `sender` - Reference to sender user
- `content` - Message content
- `messageType` - Type of message (text, image, file)
- `isRead` - Read status
- `createdAt` - Message timestamp

## Features to Implement

### **Completed Features** ✅

- [x] Real-time messaging with Socket.io
- [x] Google OAuth authentication
- [x] User search and discovery
- [x] Privacy controls (who can message you)
- [x] Message history with automatic cleanup
- [x] Conversation management (create/delete)
- [x] Online status indicators
- [x] Responsive design
- [x] User settings management
- [x] Typing indicators with real-time updates
- [x] Message read receipts with privacy controls
- [x] Sound notifications for messages and typing

### **In Progress** 🚧

- [ ] Enhanced error handling and validation
- [ ] Database optimization and indexing
- [ ] Performance improvements

### **Immediate Improvements** 📋

- [x] Typing indicators (with real-time Socket.io updates)
- [x] Message read receipts (with privacy controls)
- [ ] File/image sharing
- [ ] Message pagination with infinite scroll
- [ ] User blocking functionality
- [ ] Message search within conversations

### **Advanced Features** 🎯

- [ ] Group conversations
- [ ] Enhanced user presence indicators
- [ ] Push notifications
- [ ] Message reactions/emojis
- [ ] Voice messages
- [ ] Video calling integration
- [ ] Message encryption
- [ ] Content moderation

### **Production Readiness** 🚀

- [x] **Comprehensive testing suite** - Jest + React Testing Library + Cypress E2E
- [x] **Error tracking and monitoring** - Sentry integration for client/server/edge
- [x] **Performance optimization** - Virtual scrolling, lazy loading, performance monitoring
- [x] **Structured logging** - Winston logging with file rotation and multiple levels
- [x] **Privacy enforcement** - Backend API validation for all privacy settings
- [x] **Performance monitoring** - Custom performance tracking with metrics collection
- [x] **Error boundaries** - Graceful error handling with automatic recovery
- [x] **Environment configuration** - Complete production environment setup
- [ ] SEO improvements
- [ ] Offline functionality
- [ ] Rate limiting
- [ ] Content backup and recovery

## Testing & Quality Assurance

### Unit Testing with Jest & React Testing Library

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Features:**

- ✅ Jest configuration with Next.js integration
- ✅ React Testing Library for component testing
- ✅ @testing-library/jest-dom for custom matchers
- ✅ Automated mocking for Next.js components
- ✅ Coverage reporting with thresholds (70% minimum)
- ✅ TypeScript support

### End-to-End Testing with Cypress

```bash
# Open Cypress in interactive mode
npm run cypress:open

# Run Cypress tests in headless mode
npm run cypress:run
```

**Features:**

- ✅ Cypress configuration for Next.js
- ✅ Component and E2E testing support
- ✅ Automatic screenshots on failure
- ✅ Video recording of test runs
- ✅ Custom commands for authentication testing

## Performance Monitoring & Optimization

### Performance Monitoring

The application includes comprehensive performance monitoring:

```typescript
import { performanceMonitor, measureAsync } from "@/lib/performance";

// Measure component render times
const { startRender, endRender } =
  performanceMonitor.usePerformanceMonitor("MyComponent");

// Measure async operations
const result = await measureAsync(
  () => fetchData(),
  "DataService",
  "fetchUserData"
);
```

**Features:**

- ✅ Component render time tracking
- ✅ Async operation monitoring
- ✅ Performance metrics collection
- ✅ Slow operation detection (>100ms)
- ✅ Average performance calculation

### Performance Optimizations

1. **Virtual Scrolling** - Efficiently handles large message lists
2. **Lazy Loading** - Components and images load on-demand
3. **Error Boundaries** - Graceful error handling with automatic recovery
4. **Image Optimization** - Intersection Observer API for lazy images

```typescript
import { VirtualScroll } from '@/components/ui/VirtualScroll'
import { LazyImage, LazyLoadingBoundary } from '@/components/ui/LazyLoading'

// Virtual scrolling for messages
<VirtualScroll
  items={messages}
  itemHeight={80}
  containerHeight={400}
  renderItem={(message) => <MessageItem message={message} />}
/>

// Lazy loading with error boundaries
<LazyLoadingBoundary>
  <LazyImage src="/avatar.jpg" alt="User Avatar" />
</LazyLoadingBoundary>
```

## Error Tracking & Monitoring

### Sentry Integration

Complete error tracking and performance monitoring:

```bash
# Environment variables needed
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
```

**Features:**

- ✅ Client-side error tracking
- ✅ Server-side error tracking
- ✅ Edge runtime error tracking
- ✅ Session replay recording
- ✅ Performance monitoring
- ✅ Custom error filtering

### Winston Logging

Comprehensive logging system for server-side operations:

```typescript
import { logger } from "@/lib/logger";

logger.info("User authentication successful", { userId, email });
logger.warn("Slow database query detected", { query, duration });
logger.error("Database connection failed", { error: error.message });
```

**Features:**

- ✅ Structured JSON logging
- ✅ Multiple log levels (debug, info, warn, error)
- ✅ File-based logging with rotation
- ✅ Console logging in development
- ✅ Automatic log directory creation

Logs are written to:

- `logs/error.log` - Error level logs only
- `logs/combined.log` - All log levels
- Console - Development only

## Development

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Testing
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report

# End-to-End Testing
npm run cypress:open    # Open Cypress in interactive mode
npm run cypress:run     # Run Cypress tests in headless mode

# Performance & Monitoring
npm run analyze         # Analyze bundle size (if configured)
```

### Environment Variables

#### Development (.env.local)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/nexuschat

# Authentication
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Monitoring (optional in development)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

#### Production

```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/nexuschat

# Authentication
NEXTAUTH_SECRET=strong-production-secret
NEXTAUTH_URL=https://your-domain.com
GOOGLE_CLIENT_ID=production-google-client-id
GOOGLE_CLIENT_SECRET=production-google-client-secret

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=production-sentry-dsn
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true

# Logging
NODE_ENV=production
```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Deployment

### Production Checklist

Before deploying to production, ensure:

- ✅ All environment variables are configured
- ✅ MongoDB connection string is valid
- ✅ Google OAuth credentials are set up for production domain
- ✅ Sentry DSN is configured for error tracking
- ✅ Tests are passing (`npm test`)
- ✅ Build completes successfully (`npm run build`)
- ✅ Performance monitoring is enabled

### Environment Variables for Production

Make sure to set all environment variables in your production environment:

- `MONGODB_URI` - Production MongoDB connection string
- `NEXTAUTH_SECRET` - Strong secret key for NextAuth.js (32+ characters)
- `NEXTAUTH_URL` - Production URL (https://your-domain.com)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID for production
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret for production
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking
- `NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING` - Set to `true` for performance monitoring

### Google OAuth Production Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Update OAuth client settings:
   - Add production domain to authorized origins
   - Add `https://your-domain.com/api/auth/callback/google` to redirect URIs
3. Update environment variables with production credentials

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Enable Sentry integration (optional)
5. Deploy

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Monitoring in Production

- **Error Tracking**: Automatically tracked via Sentry
- **Performance Metrics**: Available through performance monitoring APIs
- **Logs**: Check application logs for server-side issues
- **Health Checks**: Monitor `/api/health` endpoint (if implemented)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run the test suite (`npm test`)
6. Submit a pull request

## Additional Documentation

- **[PRODUCTION_READY.md](./PRODUCTION_READY.md)** - Comprehensive guide for production deployment with testing, monitoring, and performance optimization details

## License

This project is licensed under the MIT License.

## Support

For support, email support@nexuschat.com or create an issue in the repository.
