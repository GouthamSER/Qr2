# Overview

This is a WhatsApp bot session generator called "Kuttu Bot" that provides two main authentication methods for WhatsApp bots: QR code scanning and phone number pairing. The application generates session credentials that can be used to connect WhatsApp bots to the WhatsApp Web API using the Baileys library. It includes file upload capabilities to Mega.nz cloud storage for session management and provides a web interface for easy bot deployment.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Single Page Application**: Uses a simple HTML interface (`pair.html`) with inline CSS and JavaScript
- **Responsive Design**: Mobile-first approach with CSS variables for theming
- **User Interface**: Clean, minimalist design with form-based interaction for phone number input
- **Client-Side Validation**: Basic phone number formatting and validation

## Backend Architecture
- **Framework**: Express.js server with ES modules
- **Route Structure**: Modular routing with separate routers for different functionalities
  - `/pair` - Phone number-based pairing route
  - `/qr` - QR code generation route
  - `/` - Main interface serving the HTML form
- **Session Management**: File-based session storage using Baileys' `useMultiFileAuthState`
- **Phone Number Validation**: Uses `awesome-phonenumber` library for international phone number validation
- **QR Code Generation**: Supports both terminal and web-based QR code display

## WhatsApp Integration
- **Baileys Library**: Uses `@whiskeysockets/baileys` for WhatsApp Web API connectivity
- **Authentication Methods**: 
  - QR code scanning for quick setup
  - Phone number pairing for programmatic authentication
- **Session Persistence**: Stores authentication credentials in local file system
- **Multi-Device Support**: Leverages WhatsApp's multi-device protocol

## File Storage Strategy
- **Local Session Storage**: Temporary session files stored in `./session` and `./qr_sessions` directories
- **Session Cleanup**: Automatic removal of existing sessions before creating new ones
- **Unique Session IDs**: Timestamp and random string combination to prevent conflicts

## Error Handling
- **Phone Number Validation**: Comprehensive validation using international standards
- **Session Conflict Prevention**: Unique session directories for concurrent requests
- **Graceful Failures**: Proper error responses and logging throughout the application

# External Dependencies

## WhatsApp Integration
- **@whiskeysockets/baileys**: Core WhatsApp Web API library for bot connectivity
- **qrcode**: QR code generation for web display
- **qrcode-terminal**: Terminal-based QR code display for development

## Cloud Storage
- **megajs**: Mega.nz cloud storage integration for file uploads and downloads
- **Configured Credentials**: Requires Mega.nz account credentials for file storage operations

## Phone Number Processing
- **awesome-phonenumber**: International phone number validation and formatting
- **phone**: Additional phone number utilities for validation

## Web Framework
- **express**: Core web server framework
- **body-parser**: HTTP request body parsing middleware
- **pino**: Structured logging library for application monitoring

## Deployment Platform
- **Render**: Primary deployment platform (as indicated by deployment instructions)
- **Environment Variables**: Uses PORT environment variable for flexible deployment

## Development Tools
- **Node.js**: Requires version 20.0.0 or higher
- **ES Modules**: Modern JavaScript module system throughout the application