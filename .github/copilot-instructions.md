<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# NexusChat - Real-Time Chat Application

This is a modern real-time chat application built with Next.js, focusing on:

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn/UI
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with Google OAuth
- **Real-time**: Socket.io for WebSocket communication
- **Validation**: Zod for schema validation

## Key Features

- Google OAuth authentication
- Real-time messaging with Socket.io
- User management and search
- One-on-one conversations
- Message history with pagination
- Responsive design for mobile and desktop
- Typing indicators
- Modern UI with Shadcn/UI components

## Project Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and configurations
- `src/models/` - MongoDB/Mongoose schemas
- `src/schemas/` - Zod validation schemas
- `src/types/` - TypeScript type definitions
- `src/hooks/` - Custom React hooks

## Best Practices

- Use Server Components for data fetching where possible
- Implement proper error handling and loading states
- Follow TypeScript best practices
- Use Zod for all API request validation
- Ensure responsive design with Tailwind utilities
- Implement proper authentication checks
- Use proper MongoDB indexing for performance
