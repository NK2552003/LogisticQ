# Database Setup and Troubleshooting

## Issue: "Account created successfully, but there was an issue saving user data"

This error occurs when the Clerk account is created successfully, but saving user data to your database fails. Here are the most common causes and solutions:

### 1. Database Table Missing

**Problem**: The `users` table doesn't exist in your database.

**Solution**: 
```bash
# Run the database setup script
psql $DATABASE_URL -f database/setup.sql
```

Or manually create the table using your database console with the SQL from `database/setup.sql`.

### 2. Environment Variables

**Problem**: `DATABASE_URL` is not properly configured.

**Solution**: 
- Ensure `.env` file exists in the root directory
- Verify `DATABASE_URL` is correctly set
- Restart your development server after changing environment variables

### 3. Database Connection Issues

**Problem**: Cannot connect to the database.

**Solution**:
```bash
# Test the database connection
node scripts/test-db.js
```

### 4. API Route Issues

**Problem**: The API endpoint is not being called properly.

**Recent Fix**: Changed API call from `/api/user` to `/user` to match Expo Router's file-based routing.

**Note**: In Expo Router, API files with `+api.ts` suffix create endpoints at the route path without the `+api` part.

### 5. Network/CORS Issues

**Problem**: API calls are blocked by network or CORS policies.

**Solution**: 
- Check if you're running on a physical device vs simulator
- Ensure your API endpoints are accessible from your app's network

### 6. Debugging Steps

To debug the user creation issue:

1. **Check Logs**: Look at the console output when running the app
2. **Test Database**: Run `node scripts/test-db.js` to verify database connection
3. **Test User Creation**: Run `node scripts/test-user-creation.js` to test direct database operations
4. **Check API Route**: Ensure the API endpoint is accessible at `/user`

### 7. Recent Fixes Applied

✅ **Fixed API URL**: Changed from `/api/user` to `/user`
✅ **Fixed fetchAPI function**: Removed incorrect base URL handling
✅ **Added better logging**: Enhanced error reporting in both frontend and API
✅ **Verified database**: Confirmed users table exists and is accessible

### Debugging Steps

1. **Check the logs**: Look at the console logs when the error occurs
2. **Test database connection**: Run `node scripts/test-db.js`
3. **Verify table structure**: Ensure the `users` table has the correct columns
4. **Check API response**: Look at the full error message in the console

### Database Schema

The `users` table should have these columns:
- `id` (SERIAL PRIMARY KEY)
- `email` (VARCHAR(255) UNIQUE NOT NULL)
- `first_name` (VARCHAR(100) NOT NULL)
- `last_name` (VARCHAR(100) NOT NULL)
- `clerk_user_id` (VARCHAR(255) UNIQUE NOT NULL)
- `created_at` (TIMESTAMP WITH TIME ZONE)
- `updated_at` (TIMESTAMP WITH TIME ZONE)

### Testing

After making changes, test the sign-up flow:
1. Create a new account
2. Check the console for detailed error messages
3. Verify the user appears in your database

### Common Error Messages

- `relation "users" does not exist` → Run the setup SQL script
- `Database connection failed` → Check your DATABASE_URL
- `User already exists` → Try with a different email address
- `Database table not found` → Create the users table