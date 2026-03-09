import { supabase } from './supabase'

export async function testConnection() {
  try {
    const { data, error } = await supabase.from('information_schema.tables').select('*').limit(1)
    if (error) {
      console.log('Connection error:', error)
      return false
    }
    console.log('✅ Successfully connected to Supabase!')
    return true
  } catch (err) {
    console.log('Connection failed:', err)
    return false
  }
}

export async function getTables() {
  try {
    // Query the information schema to get all user tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_type', 'BASE TABLE')
      .in('table_schema', ['public', 'auth'])
      .order('table_schema')
      .order('table_name')

    if (error) {
      console.log('Error fetching tables:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.log('Error:', err)
    return []
  }
}

export async function getTableSchema(tableName: string, schema: string = 'public') {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', tableName)
      .eq('table_schema', schema)
      .order('ordinal_position')

    if (error) {
      console.log('Error fetching table schema:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.log('Error:', err)
    return []
  }
}

export async function getRLSPolicies() {
  try {
    // Query pg_policies to get RLS policies
    const { data, error } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check')
      .order('schemaname')
      .order('tablename')
      .order('policyname')

    if (error) {
      console.log('Error fetching RLS policies:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.log('Error:', err)
    return []
  }
}

export async function getFunctions() {
  try {
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_schema, routine_type')
      .eq('routine_type', 'FUNCTION')
      .in('routine_schema', ['public', 'auth'])
      .order('routine_schema')
      .order('routine_name')

    if (error) {
      console.log('Error fetching functions:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.log('Error:', err)
    return []
  }
}

export async function exploreDatabase() {
  console.log('🔍 Exploring Supabase database...\n')

  // Test connection
  const connected = await testConnection()
  if (!connected) {
    console.log('❌ Could not connect to database')
    return
  }

  // Get tables
  console.log('\n📋 Tables:')
  const tables = await getTables()
  if (tables.length === 0) {
    console.log('No tables found or unable to access table information')
  } else {
    tables.forEach(table => {
      console.log(`  ${table.table_schema}.${table.table_name}`)
    })
  }

  // Get schema for each public table
  console.log('\n🏗️  Table Schemas:')
  const publicTables = tables.filter(t => t.table_schema === 'public')
  for (const table of publicTables) {
    console.log(`\n  ${table.table_name}:`)
    const columns = await getTableSchema(table.table_name)
    if (columns.length === 0) {
      console.log('    No columns found or unable to access schema')
    } else {
      columns.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`)
      })
    }
  }

  // Get RLS policies
  console.log('\n🔒 RLS Policies:')
  const policies = await getRLSPolicies()
  if (policies.length === 0) {
    console.log('No RLS policies found or unable to access policies')
  } else {
    policies.forEach(policy => {
      console.log(`  ${policy.schemaname}.${policy.tablename}: ${policy.policyname} (${policy.cmd})`)
    })
  }

  // Get functions
  console.log('\n⚡ Functions:')
  const functions = await getFunctions()
  if (functions.length === 0) {
    console.log('No functions found or unable to access functions')
  } else {
    functions.forEach(func => {
      console.log(`  ${func.routine_schema}.${func.routine_name}`)
    })
  }
}

// If running this script directly
if (typeof window === 'undefined' && require.main === module) {
  exploreDatabase()
}