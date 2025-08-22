// Rellena SUPABASE_URL y SUPABASE_ANON_KEY desde tu proyecto Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://jdtkgjunxdspmgbbmsdq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdGtnanVueGRzcG1nYmJtc2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4ODU0NjYsImV4cCI6MjA3MTQ2MTQ2Nn0.mIN1BHien_ldObRWmWSTqZztK6byhFAx9uxOJUnDgqo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
