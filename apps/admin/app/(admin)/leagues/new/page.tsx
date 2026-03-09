import { createServerSupabaseClient } from "@/lib/supabase/server"
import { CreateLeagueForm } from "@/components/leagues/create-league-form"

async function getCities() {
  const supabase = await createServerSupabaseClient()
  const { data: cities } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return cities || []
}

export default async function NewLeaguePage() {
  const cities = await getCities()

  return (
    <div className="max-w-2xl mx-auto">
      <CreateLeagueForm cities={cities} />
    </div>
  )
}
