import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      address,
      city,
      lat,
      lng,
      total_beds,
      available_beds,
      icu_beds,
      icu_available,
      emergency_available,
      departments,
      contact_phone,
      contact_email,
      status,
      incharge_name,
      incharge_designation,
    } = body;

    // Basic server-side validation
    if (!name || !lat || !lng || !total_beds || !contact_phone || !contact_email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (available_beds > total_beds) {
      return NextResponse.json(
        { error: "Available beds cannot exceed total beds" },
        { status: 400 }
      );
    }

    if (icu_available > icu_beds) {
      return NextResponse.json(
        { error: "ICU available cannot exceed total ICU beds" },
        { status: 400 }
      );
    }

  const departmentsArray = `{${(departments ?? []).map(d => `"${d}"`).join(',')}}`;

const result = await db.execute(sql`
  INSERT INTO hospitals (
    name, address, city, lat, lng,
    total_beds, available_beds, icu_beds, icu_available,
    emergency_available, departments,
    contact_phone, contact_email, status,
    created_at, updated_at
  ) VALUES (
    ${name},
    ${address ?? null},
    ${city ?? null},
    ${lat},
    ${lng},
    ${total_beds},
    ${available_beds},
    ${icu_beds},
    ${icu_available},
    ${emergency_available},
    ${departmentsArray}::text[],
    ${contact_phone},
    ${contact_email},
    ${status ?? "open"},
    now(),
    now()
  )
  RETURNING id
`);

    const hospitalId = result.rows?.[0]?.id;

    // Optionally store incharge info in a separate table or log it
    // For now we log it — you can add an incharges table later
    console.log(`[Hospital Registration] ID: ${hospitalId} | Incharge: ${incharge_name} (${incharge_designation})`);

    return NextResponse.json({
      success: true,
      hospitalId,
      message: "Hospital registered successfully. Pending review.",
    });

  } catch (error) {
    console.error("[/api/hospitals/register] Error:", error);

    // Handle duplicate hospital name/email
    if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
      return NextResponse.json(
        { error: "A hospital with this name or email already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}