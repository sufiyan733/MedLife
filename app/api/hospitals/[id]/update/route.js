import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      total_beds,
      available_beds,
      icu_beds,
      icu_available,
      emergency_available,
      departments,
      contact_phone,
      contact_email,
    } = body;

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

    const departmentsArray = `{${(departments ?? []).map((d) => `"${d}"`).join(",")}}`;

    await db.execute(sql`
      UPDATE hospitals SET
        total_beds          = ${total_beds},
        available_beds      = ${available_beds},
        icu_beds            = ${icu_beds},
        icu_available       = ${icu_available},
        emergency_available = ${emergency_available},
        departments         = ${departmentsArray}::text[],
        contact_phone       = ${contact_phone ?? null},
        contact_email       = ${contact_email ?? null},
        updated_at          = now()
      WHERE id = ${id}
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/hospitals/[id]/update] Error:", error);
    return NextResponse.json(
      { error: "Update failed. Please try again." },
      { status: 500 }
    );
  }
}