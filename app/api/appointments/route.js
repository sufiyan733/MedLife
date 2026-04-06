import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

// POST /api/appointments — create a new appointment
export async function POST(request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const {
      hospital_name,
      department,
      date,
      time_slot,
      patient_name,
      patient_phone,
      reason,
      token_number,
    } = body;

    if (!hospital_name || !department || !date || !time_slot || !patient_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const userId = session?.user?.id;
    const id =
      token_number || `ML-${Date.now().toString(36).toUpperCase().slice(-6)}`;

    // If we have a logged-in user, persist to database
    if (userId) {
      try {
        await db.execute(sql`
          INSERT INTO appointments (
            id, user_id, hospital_name, hospital_address, department,
            date, time_slot, patient_name, patient_phone, reason,
            status, token_number, created_at, updated_at
          ) VALUES (
            ${id},
            ${userId},
            ${hospital_name},
            ${body.hospital_address || null},
            ${department},
            ${date},
            ${time_slot},
            ${patient_name},
            ${patient_phone || null},
            ${reason || null},
            'confirmed',
            ${id},
            now(),
            now()
          )
        `);
      } catch (dbError) {
        console.error("[POST /api/appointments] DB error:", dbError);
        // Fall through — still return success so client can save to localStorage
      }
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id,
        hospital_name,
        department,
        date,
        time_slot,
        patient_name,
        patient_phone,
        reason,
        token_number: id,
        status: "confirmed",
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[POST /api/appointments] Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/appointments — fetch authenticated user's appointments
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ appointments: [] });
    }

    const result = await db.execute(sql`
      SELECT
        id, hospital_name, hospital_address, department,
        date, time_slot, patient_name, patient_phone,
        reason, status, token_number, created_at
      FROM appointments
      WHERE user_id = ${session.user.id}
      ORDER BY date DESC, created_at DESC
    `);

    return NextResponse.json({
      success: true,
      appointments: result.rows || [],
    });
  } catch (error) {
    console.error("[GET /api/appointments] Error:", error);
    return NextResponse.json({ appointments: [] });
  }
}

// PATCH /api/appointments — cancel an appointment
export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing id or status" },
        { status: 400 }
      );
    }

    await db.execute(sql`
      UPDATE appointments
      SET status = ${status}, updated_at = now()
      WHERE id = ${id} AND user_id = ${session.user.id}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/appointments] Error:", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}
