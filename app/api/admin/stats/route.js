import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// GET /api/admin/stats — fetch real-time stats for the admin dashboard
export async function GET() {
  try {
    // Count hospitals
    const hospitalCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM hospitals
    `);

    // Count users
    const userCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM "user"
    `);

    // Count appointments by status
    const appointments = await db.execute(sql`
      SELECT status, COUNT(*) as count FROM appointments GROUP BY status
    `);

    // Recent appointments
    const recentAppointments = await db.execute(sql`
      SELECT id, hospital_name, department, date, time_slot, patient_name, status, created_at
      FROM appointments
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Registered hospitals
    const registeredHospitals = await db.execute(sql`
      SELECT id, name, city, total_beds, available_beds, icu_beds, icu_available, status, created_at
      FROM hospitals
      ORDER BY created_at DESC
      LIMIT 20
    `);

    const appointmentStats = {};
    (appointments.rows || []).forEach((r) => {
      appointmentStats[r.status] = parseInt(r.count);
    });

    return NextResponse.json({
      success: true,
      stats: {
        hospitals: parseInt(hospitalCount.rows?.[0]?.count || 0),
        users: parseInt(userCount.rows?.[0]?.count || 0),
        appointments: appointmentStats,
        totalAppointments: Object.values(appointmentStats).reduce((a, b) => a + b, 0),
      },
      recentAppointments: recentAppointments.rows || [],
      registeredHospitals: registeredHospitals.rows || [],
    });
  } catch (error) {
    console.error("[GET /api/admin/stats] Error:", error);
    return NextResponse.json({
      success: false,
      stats: { hospitals: 0, users: 0, appointments: {}, totalAppointments: 0 },
      recentAppointments: [],
      registeredHospitals: [],
    });
  }
}
