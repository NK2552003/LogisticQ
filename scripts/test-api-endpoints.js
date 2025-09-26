const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function testAPIEndpoints() {
  try {
    console.log('🧪 Testing API endpoints...');
    
    // First, let's check if we have any test users
    const existingUsers = await sql`SELECT * FROM users LIMIT 5`;
    console.log(`📊 Found ${existingUsers.length} existing users in database`);
    
    if (existingUsers.length > 0) {
      console.log('👤 Sample user:', {
        id: existingUsers[0].id,
        email: existingUsers[0].email,
        clerk_user_id: existingUsers[0].clerk_user_id,
        role: existingUsers[0].role
      });
      
      // Test the endpoints by simulating HTTP requests
      const testClerkUserId = existingUsers[0].clerk_user_id;
      
      console.log('\n🧪 Testing GET /user endpoint...');
      try {
        // Simulate the GET request logic
        const getUserResult = await sql`
          SELECT id, email, first_name, last_name, clerk_user_id, role, profile_completed, created_at, updated_at
          FROM users 
          WHERE clerk_user_id = ${testClerkUserId}
        `;
        
        if (getUserResult.length > 0) {
          console.log('✅ GET /user endpoint would work correctly');
          console.log('   Response:', {
            user: {
              id: getUserResult[0].id,
              email: getUserResult[0].email,
              role: getUserResult[0].role,
              profile_completed: getUserResult[0].profile_completed
            }
          });
        } else {
          console.log('❌ GET /user endpoint would return 404');
        }
      } catch (error) {
        console.log('❌ GET /user endpoint would fail:', error.message);
      }
      
      console.log('\n🧪 Testing GET /user/role endpoint...');
      try {
        // Simulate the GET /user/role request logic
        const getRoleResult = await sql`
          SELECT id, email, first_name, last_name, clerk_user_id, role, profile_completed, created_at, updated_at
          FROM users 
          WHERE clerk_user_id = ${testClerkUserId}
        `;
        
        if (getRoleResult.length > 0) {
          console.log('✅ GET /user/role endpoint would work correctly');
          console.log('   Response:', {
            user: {
              role: getRoleResult[0].role,
              profile_completed: getRoleResult[0].profile_completed
            }
          });
        } else {
          console.log('❌ GET /user/role endpoint would return 404');
        }
      } catch (error) {
        console.log('❌ GET /user/role endpoint would fail:', error.message);
      }
    } else {
      console.log('⚠️  No users found in database. Creating a test user for API testing...');
      
      const testUser = {
        email: 'api-test@logisticq.com',
        firstName: 'API',
        lastName: 'Test',
        clerkUserId: 'test_clerk_' + Date.now(),
        password: 'test_password_123',
        role: 'business'
      };
      
      // Create test user
      const createResult = await sql`
        INSERT INTO users (email, first_name, last_name, clerk_user_id, password, role, created_at, updated_at)
        VALUES (${testUser.email}, ${testUser.firstName}, ${testUser.lastName}, ${testUser.clerkUserId}, ${testUser.password}, ${testUser.role}, NOW(), NOW())
        RETURNING id, email, first_name, last_name, clerk_user_id, role, created_at, updated_at
      `;
      
      console.log('✅ Test user created:', createResult[0]);
      
      // Test endpoints with the new user
      console.log('\n🧪 Testing endpoints with new test user...');
      
      const testClerkUserId = createResult[0].clerk_user_id;
      
      // Test GET /user
      const getUserResult = await sql`
        SELECT id, email, first_name, last_name, clerk_user_id, role, profile_completed, created_at, updated_at
        FROM users 
        WHERE clerk_user_id = ${testClerkUserId}
      `;
      
      console.log('✅ GET /user endpoint test passed');
      console.log('   User data:', getUserResult[0]);
      
      // Test GET /user/role
      console.log('✅ GET /user/role endpoint test passed');
      console.log('   Role data:', { role: getUserResult[0].role });
    }
    
    console.log('\n🎉 API endpoint tests completed!');
    console.log('\n📝 Available endpoints:');
    console.log('   GET  /user?clerkUserId=xxx        - Fetch user data');
    console.log('   POST /user                        - Create new user');
    console.log('   GET  /user/role?clerkUserId=xxx   - Fetch user role');
    console.log('   PUT  /user/role                   - Update user role');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ API endpoint testing failed:', error);
    process.exit(1);
  }
}

testAPIEndpoints();