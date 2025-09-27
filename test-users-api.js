// Test script for the users API with location data
const API_BASE_URL = 'http://localhost:8081';

async function testUsersAPI() {
    console.log('🧪 Testing Users API with location data...\n');
    
    try {
        // Test 1: Fetch all users with location data
        console.log('📍 Test 1: Fetching all users with location data');
        const response1 = await fetch(`${API_BASE_URL}/users?includeLocation=true`);
        const data1 = await response1.json();
        
        if (data1.success) {
            console.log('✅ Success! Found', data1.count, 'users');
            
            // Show sample data
            if (data1.data && data1.data.length > 0) {
                const sampleUser = data1.data[0];
                console.log('📊 Sample user data:');
                console.log('   - Name:', sampleUser.display_name || `${sampleUser.first_name} ${sampleUser.last_name}`);
                console.log('   - Role:', sampleUser.role);
                console.log('   - Location Status:', sampleUser.location_status);
                if (sampleUser.current_latitude && sampleUser.current_longitude) {
                    console.log('   - Coordinates:', `${sampleUser.current_latitude}, ${sampleUser.current_longitude}`);
                } else {
                    console.log('   - Coordinates: Not available');
                }
                
                // Count users by role
                const roleCount = data1.data.reduce((acc, user) => {
                    acc[user.role] = (acc[user.role] || 0) + 1;
                    return acc;
                }, {});
                console.log('👥 Users by role:', roleCount);
                
                // Count users with location
                const withLocation = data1.data.filter(user => 
                    user.current_latitude && user.current_longitude
                ).length;
                console.log('📍 Users with location data:', withLocation, 'out of', data1.data.length);
            }
        } else {
            console.error('❌ Failed:', data1.error);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test 2: Fetch only transporters with location data
        console.log('🚚 Test 2: Fetching transporters with location data');
        const response2 = await fetch(`${API_BASE_URL}/users?role=transporter&includeLocation=true`);
        const data2 = await response2.json();
        
        if (data2.success) {
            console.log('✅ Success! Found', data2.count, 'transporters');
            
            if (data2.data && data2.data.length > 0) {
                data2.data.forEach((transporter, index) => {
                    console.log(`   ${index + 1}. ${transporter.display_name || transporter.first_name}`);
                    console.log(`      Vehicle: ${transporter.vehicle_type || 'N/A'}`);
                    console.log(`      Available: ${transporter.is_available ? 'Yes' : 'No'}`);
                    if (transporter.current_latitude && transporter.current_longitude) {
                        console.log(`      Location: ${transporter.current_latitude}, ${transporter.current_longitude}`);
                    } else {
                        console.log(`      Location: Not available`);
                    }
                    console.log('');
                });
            }
        } else {
            console.error('❌ Failed:', data2.error);
        }

    } catch (error) {
        console.error('❌ Network error:', error.message);
        console.log('\n💡 Make sure the Expo dev server is running on port 8081');
        console.log('💡 Run: npx expo start --port 8081');
    }
}

// Run the test
testUsersAPI();