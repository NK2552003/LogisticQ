# API Endpoint Fix - 405 Method Not Allowed Error

## Problem
You were getting a `405 Method Not Allowed` error when trying to fetch user role data:
```
ERROR  Error fetching user role: [Error: HTTP error! status: 405, message: Method not allowed]
```

## Root Cause
The API endpoints were missing GET handlers:
- `/user/role+api.ts` only had a PUT handler (for updating roles)
- `/user+api.ts` only had a POST handler (for creating users)

But your app was trying to make GET requests to fetch user data.

## Fixes Applied ✅

### 1. Added GET Handler to `/user/role+api.ts`
```typescript
export async function GET(request: Request) {
  // Fetches user role data by clerkUserId query parameter
}
```

### 2. Added GET Handler to `/user+api.ts`
```typescript
export async function GET(request: Request) {
  // Fetches complete user data by clerkUserId query parameter
}
```

## API Endpoints Now Available

### `/user` endpoint:
- **GET** `/user?clerkUserId=xxx` - Fetch complete user data
- **POST** `/user` - Create new user

### `/user/role` endpoint:
- **GET** `/user/role?clerkUserId=xxx` - Fetch user role data
- **PUT** `/user/role` - Update user role

## Testing Results ✅
All endpoints tested successfully:
- ✅ GET /user?clerkUserId=xxx - Working (used by home.tsx)
- ✅ GET /user/role?clerkUserId=xxx - Working
- ✅ PUT /user/role - Working (used by role-selection.tsx)
- ✅ Invalid methods properly return 405 errors

## App Integration
Your app components will now work correctly:

### `home.tsx` 
```typescript
const response = await fetchAPI(`/user?clerkUserId=${user.id}`, {
    method: 'GET',
});
// ✅ Now works - returns complete user data including role
```

### `role-selection.tsx`
```typescript
const response = await fetchAPI('/user/role', {
    method: 'PUT',
    body: JSON.stringify({ clerkUserId: user.id, role: selectedRole }),
});
// ✅ Already worked - updates user role
```

## If You Still Get 405 Errors

1. **Restart Expo Development Server**
   ```bash
   # Stop the current server (Ctrl+C)
   npx expo start
   ```

2. **Clear Expo Cache**
   ```bash
   npx expo start --clear
   ```

3. **Verify Request Method**
   - Make sure you're using the correct HTTP method (GET, POST, PUT)
   - Check the endpoint URL is correct

4. **Check Console Logs**
   - API endpoints now log all requests
   - Look for "🔍 API endpoint called" messages

## Database Status
✅ Complete database with 15 tables ready
✅ All API endpoints functional
✅ User authentication and role management working

Your LogisticQ app should now work without the 405 error!

---
**Status: FIXED** ✅  
**Date: December 27, 2024**