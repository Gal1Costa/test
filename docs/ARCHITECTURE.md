# TrailHub Architecture

## Overview
Modular Monolith with MVC layering, built with Node.js/Express + Socket.IO + PostgreSQL(+PostGIS) + Firebase Auth/Storage.

## Architecture Layers

### Application Layer (`/src/app/`)
- **index.js**: Server bootstrap, HTTP + Socket.IO initialization
- **config.js**: Environment configuration loader
- **routes.js**: Main router mounting all module endpoints
- **auth.middleware.js**: Firebase token verification → req.user
- **roles.middleware.js**: Role-based access control
- **errors.js**: Centralized error handling

### Shared Layer (`/src/shared/`)
- **db.js**: PostgreSQL pool management
- **logger.js**: Minimal JSON console logger

### Adapters Layer (`/src/adapters/`)
- **firebase.auth.js**: Token verification stub
- **firebase.storage.js**: File upload/delete stubs
- **payments.adapter.js**: Payment intent stubs
- **maps.adapter.js**: Geocoding stubs

### Modules Layer (`/src/modules/`)
Each module contains:
- **controller/**: Express routers with role guards
- **repository/**: Data access stubs (no SQL yet)
- **gateway/**: Socket.IO handlers (chat module)

## Module Structure

### Core Modules
- **identity**: User profile management
- **users**: User data and profiles
- **guides**: Guide profiles and verification
- **hikes**: Trail management
- **bookings**: Reservation system
- **reviews**: Rating and feedback
- **chat**: Real-time messaging
- **administration**: Admin operations
- **analytics**: Reporting and metrics

## Roles
- **visitor**: Anonymous access
- **hiker**: Can book hikes, leave reviews
- **guide**: Can create hikes, manage bookings
- **admin**: Full system access

## Technology Stack
- **Backend**: Node.js + Express
- **Database**: PostgreSQL + PostGIS
- **Real-time**: Socket.IO
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **Architecture**: Modular Monolith

## Development Status
Current implementation: Structure and stubs only. No business logic or database queries implemented yet.