import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// GET /api/hospitals — list all registered hospitals
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query;

    if (city && status) {
      query = sql`
        SELECT id, name, address, city, lat, lng,
          total_beds, available_beds, icu_beds, icu_available,
          emergency_available, departments,
          contact_phone, contact_email, status,
          created_at, updated_at
        FROM hospitals
        WHERE LOWER(city) = LOWER(${city}) AND status = ${status}
        ORDER BY name ASC
        LIMIT ${limit}
      `;
    } else if (city) {
      query = sql`
        SELECT id, name, address, city, lat, lng,
          total_beds, available_beds, icu_beds, icu_available,
          emergency_available, departments,
          contact_phone, contact_email, status,
          created_at, updated_at
        FROM hospitals
        WHERE LOWER(city) = LOWER(${city})
        ORDER BY name ASC
        LIMIT ${limit}
      `;
    } else if (status) {
      query = sql`
        SELECT id, name, address, city, lat, lng,
          total_beds, available_beds, icu_beds, icu_available,
          emergency_available, departments,
          contact_phone, contact_email, status,
          created_at, updated_at
        FROM hospitals
        WHERE status = ${status}
        ORDER BY name ASC
        LIMIT ${limit}
      `;
    } else {
      query = sql`
        SELECT id, name, address, city, lat, lng,
          total_beds, available_beds, icu_beds, icu_available,
          emergency_available, departments,
          contact_phone, contact_email, status,
          created_at, updated_at
        FROM hospitals
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
    }

    const result = await db.execute(query);

    return NextResponse.json({
      success: true,
      hospitals: result.rows || [],
      count: result.rows?.length || 0,
    });
  } catch (error) {
    console.error("[GET /api/hospitals] Error:", error);
    return NextResponse.json({
      success: false,
      hospitals: [],
      count: 0,
    });
  }
}
