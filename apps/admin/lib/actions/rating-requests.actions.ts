"use server"

import { createServerSupabaseClient, getServerAdmin } from "@/lib/supabase/server"

export interface RatingRequestWithDetails {
  id: string
  player_id: string
  current_rating: number
  requested_rating: number
  reason: string
  status: "pending" | "approved" | "rejected"
  admin_notes: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
  player: {
    id: string
    first_name: string
    last_name: string
    rating: number
  } | null
}

interface ActionResult<T> {
  data: T | null
  error: string | null
}

/**
 * Get all rating change requests, optionally filtered by status.
 */
export async function getRatingRequests(
  status?: "pending" | "approved" | "rejected"
): Promise<ActionResult<RatingRequestWithDetails[]>> {
  try {
    const admin = await getServerAdmin()
    if (!admin) return { data: null, error: "Unauthorized" }

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from("rating_change_requests")
      .select(`
        *,
        player:players!player_id(
          id, first_name, last_name, rating
        )
      `)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) throw error

    return { data: (data as RatingRequestWithDetails[]) || [], error: null }
  } catch (error) {
    console.error("Error fetching rating requests:", error)
    return { data: null, error: "Failed to fetch rating requests" }
  }
}

/**
 * Approve a rating change request.
 * Updates the player's rating and marks the request as approved.
 */
export async function approveRatingRequest(
  requestId: string,
  adminNotes: string
): Promise<ActionResult<boolean>> {
  try {
    const admin = await getServerAdmin()
    if (!admin) return { data: null, error: "Unauthorized" }

    const supabase = await createServerSupabaseClient()

    // Fetch the request to get player_id and requested_rating
    const { data: request, error: fetchError } = await supabase
      .from("rating_change_requests")
      .select("player_id, requested_rating, current_rating")
      .eq("id", requestId)
      .single()

    if (fetchError || !request) {
      return { data: null, error: "Request not found" }
    }

    // Update player's rating first
    const { error: playerError } = await supabase
      .from("players")
      .update({ rating: request.requested_rating })
      .eq("id", request.player_id)

    if (playerError) {
      console.error("Error updating player rating:", playerError)
      return { data: null, error: "Failed to update player rating" }
    }

    // Mark request as approved
    const { error: updateError } = await supabase
      .from("rating_change_requests")
      .update({
        status: "approved",
        admin_notes: adminNotes,
        reviewed_by: admin.id,
      })
      .eq("id", requestId)

    if (updateError) throw updateError

    // Audit log
    await supabase.from("admin_audit_log").insert({
      admin_id: admin.id,
      action: "approve_rating_request",
      entity_type: "rating_change_request",
      entity_id: requestId,
      changes: {
        status: "approved",
        admin_notes: adminNotes,
        player_id: request.player_id,
        old_rating: request.current_rating,
        new_rating: request.requested_rating,
      },
    })

    return { data: true, error: null }
  } catch (error) {
    console.error("Error approving rating request:", error)
    return { data: null, error: "Failed to approve request" }
  }
}

/**
 * Reject a rating change request.
 */
export async function rejectRatingRequest(
  requestId: string,
  adminNotes: string
): Promise<ActionResult<boolean>> {
  try {
    const admin = await getServerAdmin()
    if (!admin) return { data: null, error: "Unauthorized" }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from("rating_change_requests")
      .update({
        status: "rejected",
        admin_notes: adminNotes,
        reviewed_by: admin.id,
      })
      .eq("id", requestId)

    if (error) throw error

    // Audit log
    await supabase.from("admin_audit_log").insert({
      admin_id: admin.id,
      action: "reject_rating_request",
      entity_type: "rating_change_request",
      entity_id: requestId,
      changes: { status: "rejected", admin_notes: adminNotes },
    })

    return { data: true, error: null }
  } catch (error) {
    console.error("Error rejecting rating request:", error)
    return { data: null, error: "Failed to reject request" }
  }
}
