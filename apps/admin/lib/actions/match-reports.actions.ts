"use server"

import { createServerSupabaseClient, getServerAdmin } from "@/lib/supabase/server"

export interface MatchReportWithDetails {
  id: string
  player_match_id: string
  reported_by: string
  reason: string
  status: "pending" | "reviewed" | "dismissed"
  admin_notes: string | null
  reviewed_by: string | null
  resolved_at: string | null
  created_at: string
  reporter: {
    id: string
    first_name: string
    last_name: string
  } | null
  player_match: {
    id: string
    player1_id: string
    player2_id: string
    winner_id: string | null
    scores: any
    match_date: string
    ladder_challenge_id: string | null
    player1: { id: string; first_name: string; last_name: string } | null
    player2: { id: string; first_name: string; last_name: string } | null
  } | null
}

export interface ActionResult<T> {
  data: T | null
  error: string | null
}

/**
 * Get all match reports, optionally filtered by status.
 */
export async function getMatchReports(
  status?: "pending" | "reviewed" | "dismissed"
): Promise<ActionResult<MatchReportWithDetails[]>> {
  try {
    const admin = await getServerAdmin()
    if (!admin) return { data: null, error: "Unauthorized" }

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from("match_reports")
      .select(`
        *,
        reporter:players!reported_by(
          id, first_name, last_name
        ),
        player_match:player_matches!player_match_id(
          id, player1_id, player2_id, winner_id, scores, match_date, ladder_challenge_id,
          player1:players!player1_id(id, first_name, last_name),
          player2:players!player2_id(id, first_name, last_name)
        )
      `)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) throw error

    return { data: (data as MatchReportWithDetails[]) || [], error: null }
  } catch (error) {
    console.error("Error fetching match reports:", error)
    return { data: null, error: "Failed to fetch reports" }
  }
}

/**
 * Review a match report (mark as reviewed with admin notes).
 */
export async function reviewReport(
  reportId: string,
  adminNotes: string
): Promise<ActionResult<boolean>> {
  try {
    const admin = await getServerAdmin()
    if (!admin) return { data: null, error: "Unauthorized" }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from("match_reports")
      .update({
        status: "reviewed",
        admin_notes: adminNotes,
        reviewed_by: admin.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId)

    if (error) throw error

    // Log to audit
    await supabase.from("admin_audit_log").insert({
      admin_id: admin.id,
      action: "review_match_report",
      entity_type: "match_report",
      entity_id: reportId,
      changes: { status: "reviewed", admin_notes: adminNotes },
    })

    return { data: true, error: null }
  } catch (error) {
    console.error("Error reviewing report:", error)
    return { data: null, error: "Failed to review report" }
  }
}

/**
 * Dismiss a match report.
 */
export async function dismissReport(
  reportId: string,
  adminNotes: string
): Promise<ActionResult<boolean>> {
  try {
    const admin = await getServerAdmin()
    if (!admin) return { data: null, error: "Unauthorized" }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from("match_reports")
      .update({
        status: "dismissed",
        admin_notes: adminNotes,
        reviewed_by: admin.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId)

    if (error) throw error

    // Log to audit
    await supabase.from("admin_audit_log").insert({
      admin_id: admin.id,
      action: "dismiss_match_report",
      entity_type: "match_report",
      entity_id: reportId,
      changes: { status: "dismissed", admin_notes: adminNotes },
    })

    return { data: true, error: null }
  } catch (error) {
    console.error("Error dismissing report:", error)
    return { data: null, error: "Failed to dismiss report" }
  }
}
