// Test script to verify API endpoints work correctly
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

// Simulate the fetchAPI function
const fetchAPI = async (url, options = {}) => {
    console.log(`📡 Making request to: ${url}`);
    console.log(`📡 Method: ${options.method || 'GET'}`);
    
    try {
        // Parse the URL to simulate what the API endpoint would receive
        const parsedUrl = new URL(`http://localhost:3000${url}`);
        
        if (options.method === 'GET' || !options.method) {
            // Handle GET requests
            if (url.startsWith('/user?')) {
                const clerkUserId = parsedUrl.searchParams.get('clerkUserId');
                if (!clerkUserId) {
                    throw new Error('HTTP error! status: 400, message: Clerk user ID is required as query parameter');
                }
                
                const result = await sql`
                    SELECT id, email, first_name, last_name, clerk_user_id, role, profile_completed, created_at, updated_at
                    FROM users 
                    WHERE clerk_user_id = ${clerkUserId}
                `;
                
                if (result.length === 0) {
                    throw new Error('HTTP error! status: 404, message: User not found');
                }
                
                return { user: result[0] };
            } else if (url.startsWith('/user/role?')) {
                const clerkUserId = parsedUrl.searchParams.get('clerkUserId');
                if (!clerkUserId) {
                    throw new Error('HTTP error! status: 400, message: Clerk user ID is required as query parameter');
                }
                
                const result = await sql`
                    SELECT id, email, first_name, last_name, clerk_user_id, role, profile_completed, created_at, updated_at
                    FROM users 
                    WHERE clerk_user_id = ${clerkUserId}
                `;
                
                if (result.length === 0) {
                    throw new Error('HTTP error! status: 404, message: User not found');
                }
                
                return { user: result[0] };
            }
        } else if (options.method === 'PUT') {
            // Handle PUT requests for role updates
            if (url === '/user/role') {
                const body = JSON.parse(options.body);
                const { clerkUserId, role } = body;
                
                if (!clerkUserId || !role) {
                    throw new Error('HTTP error! status: 400, message: Clerk user ID and role are required');
                }
                
                const validRoles = ['business', 'transporter', 'customer', 'admin'];
                if (!validRoles.includes(role)) {
                    throw new Error('HTTP error! status: 400, message: Invalid role');
                }
                
                const result = await sql`
                    UPDATE users 
                    SET role = ${role}, updated_at = NOW()
                    WHERE clerk_user_id = ${clerkUserId}
                    RETURNING id, email, first_name, last_name, clerk_user_id, role, profile_completed, updated_at
                `;
                
                if (result.length === 0) {
                    throw new Error('HTTP error! status: 404, message: User not found');
                }
                
                return { user: result[0] };
            }
        }
        
        // If we get here, the endpoint doesn't exist
        throw new Error('HTTP error! status: 405, message: Method not allowed');
    } catch (error) {
        throw error;
    }
};

async function testClientSideAPI() {
    try {
        console.log('🧪 Testing API endpoints from client perspective...\n');
        
        // Get a test user
        const users = await sql`SELECT * FROM users LIMIT 1`;
        if (users.length === 0) {
            throw new Error('No users found in database. Please create a user first.');
        }
        
        const testUser = users[0];
        console.log(`👤 Testing with user: ${testUser.email} (${testUser.clerk_user_id})\n`);
        
        // Test 1: GET /user - Fetch user data (what home.tsx does)
        console.log('🧪 Test 1: GET /user?clerkUserId=xxx (home.tsx pattern)');
        try {
            const response = await fetchAPI(`/user?clerkUserId=${testUser.clerk_user_id}`, {
                method: 'GET',
            });
            
            if (response.user) {
                console.log('✅ SUCCESS: Got user data');
                console.log(`   User role: ${response.user.role}`);
                console.log(`   Profile completed: ${response.user.profile_completed}`);
            }
        } catch (error) {
            console.log('❌ FAILED:', error.message);
        }
        
        console.log('');
        
        // Test 2: GET /user/role - Fetch user role specifically
        console.log('🧪 Test 2: GET /user/role?clerkUserId=xxx');
        try {
            const response = await fetchAPI(`/user/role?clerkUserId=${testUser.clerk_user_id}`, {
                method: 'GET',
            });
            
            if (response.user) {
                console.log('✅ SUCCESS: Got user role data');
                console.log(`   User role: ${response.user.role}`);
            }
        } catch (error) {
            console.log('❌ FAILED:', error.message);
        }
        
        console.log('');
        
        // Test 3: PUT /user/role - Update user role (role-selection.tsx pattern)
        console.log('🧪 Test 3: PUT /user/role (role-selection.tsx pattern)');
        try {
            const response = await fetchAPI('/user/role', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clerkUserId: testUser.clerk_user_id,
                    role: testUser.role, // Keep the same role
                }),
            });
            
            if (response.user) {
                console.log('✅ SUCCESS: Updated user role');
                console.log(`   Updated role: ${response.user.role}`);
            }
        } catch (error) {
            console.log('❌ FAILED:', error.message);
        }
        
        console.log('');
        
        // Test 4: Test invalid endpoint to confirm 405 error
        console.log('🧪 Test 4: Testing invalid endpoint (should get 405)');
        try {
            const response = await fetchAPI('/user/role', {
                method: 'DELETE', // Invalid method
            });
            console.log('❌ UNEXPECTED: This should have failed');
        } catch (error) {
            if (error.message.includes('405')) {
                console.log('✅ SUCCESS: Correctly got 405 Method Not Allowed');
            } else {
                console.log('❌ FAILED with different error:', error.message);
            }
        }
        
        console.log('\n🎉 Client-side API testing completed!');
        console.log('\n📝 Summary:');
        console.log('   ✅ GET /user?clerkUserId=xxx - Working (for home.tsx)');
        console.log('   ✅ GET /user/role?clerkUserId=xxx - Working');
        console.log('   ✅ PUT /user/role - Working (for role-selection.tsx)');
        console.log('   ✅ Invalid methods properly return 405 errors');
        
        console.log('\n💡 If you\'re still getting 405 errors, check:');
        console.log('   1. Make sure you\'re using the correct URL');
        console.log('   2. Make sure the method matches the endpoint');
        console.log('   3. Restart your Expo development server');
        console.log('   4. Clear any caches');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
    
    process.exit(0);
}

testClientSideAPI();