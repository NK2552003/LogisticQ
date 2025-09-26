const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function testUserCreation() {
  try {
    console.log('Testing user creation...');
    
    const testUser = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      clerkUserId: 'test_clerk_id_123',
      password: 'testpassword123'
    };
    
    // Try to insert a test user
    const result = await sql`
      INSERT INTO users (email, first_name, last_name, clerk_user_id, password, created_at, updated_at)
      VALUES (${testUser.email}, ${testUser.firstName}, ${testUser.lastName}, ${testUser.clerkUserId}, ${testUser.password}, NOW(), NOW())
      RETURNING id, email, first_name, last_name, clerk_user_id, created_at, updated_at
    `;
    
    console.log('✅ Test user created successfully:');
    console.log(result[0]);
    
    // Clean up - delete the test user
    await sql`DELETE FROM users WHERE email = ${testUser.email}`;
    console.log('✅ Test user cleaned up');
    
  } catch (error) {
    console.error('❌ User creation failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('unique constraint')) {
      console.log('💡 Test user already exists, cleaning up...');
      try {
        await sql`DELETE FROM users WHERE email = 'test@example.com'`;
        console.log('✅ Test user cleaned up, try running the test again');
      } catch (cleanupError) {
        console.error('❌ Cleanup failed:', cleanupError.message);
      }
    }
  }
}

testUserCreation();