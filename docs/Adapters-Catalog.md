# Adapters Catalog

## Firebase Authentication Adapter
- **File**: `src/adapters/firebase.auth.js`
- **Purpose**: Token verification for user authentication
- **Methods**:
  - `verifyIdToken(idToken)` → `{ uid, email }`
- **Status**: Stub implementation with TODO for firebase-admin integration

## Firebase Storage Adapter
- **File**: `src/adapters/firebase.storage.js`
- **Purpose**: File upload and management
- **Methods**:
  - `uploadObject(key, buffer, contentType)` → `{ key, url }`
  - `deleteObject(key)` → `boolean`
- **Status**: Stub implementation with TODO for firebase-admin storage

## Payments Adapter
- **File**: `src/adapters/payments.adapter.js`
- **Purpose**: Payment processing (not implemented yet)
- **Methods**:
  - `createIntent(amount, currency)` → `{ id, clientSecret }`
  - `refund(intentId)` → `{ id, status }`
- **Status**: Stub implementation - payments not implemented yet

## Maps Adapter 
- **File**: `src/adapters/maps.adapter.js`
- **Purpose**: Geocoding and location services
- **Methods**:
  - `geocode(address)` → `{ lat, lng }`
  - `reverseGeocode(lat, lng)` → `{ address }`
- **Status**: Optional stub implementation
