// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://axiucsclctzsulquevug.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aXVjc2NsY3R6c3VscXVldnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NTk2NjQsImV4cCI6MjA3NTMzNTY2NH0.POreUHWnZnGNMBtlb8y23YuyY-SjGWZR0CUHMeF33X4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
