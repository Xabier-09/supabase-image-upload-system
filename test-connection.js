// Test script to verify Supabase connection
console.log('Testing Supabase connection...');

// Use the same configuration as app.js
const SUPABASE_URL = 'https://jdtkgjunxdspmgbbmsdq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdGtnanVueGRzcG1nYmJtc2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODU0NjYsImV4cCI6MjA3MTQ2MTQ2Nn0.mIN1BHien_ldObRWmWSTqZztK6byhFAx9uxOJUnDgqo';

// Test if Supabase is available
if (typeof window.supabase === 'undefined') {
    console.error('Supabase client not loaded. Check if the CDN script is included.');
} else {
    console.log('Supabase client loaded successfully');
    
    // Test connection
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    supabase.auth.getSession()
        .then(({ data, error }) => {
            if (error) {
                console.error('Connection failed:', error);
                console.log('Possible issues:');
                console.log('1. Check internet connection');
                console.log('2. Verify Supabase URL and API key');
                console.log('3. Check CORS settings in Supabase dashboard');
                console.log('4. Ensure Supabase project is active');
            } else {
                console.log('Connection successful!');
                console.log('Session data:', data);
            }
        })
        .catch(error => {
            console.error('Connection test failed:', error);
        });
}

// Test network connectivity
console.log('Testing network connectivity to Supabase...');
fetch(SUPABASE_URL + '/rest/v1/', {
    method: 'HEAD',
    headers: {
        'apikey': SUPABASE_ANON_KEY
    }
})
.then(response => {
    console.log('Network connectivity:', response.status, response.statusText);
    if (!response.ok) {
        console.error('Network request failed. Check CORS settings.');
    }
})
.catch(error => {
    console.error('Network test failed:', error);
    console.log('This suggests a network connectivity issue or CORS problem');
});
