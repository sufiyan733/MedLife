import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getSession() {
  return await auth.api.getSession({ headers: await headers() });
}

// GET /api/profile — fetch the signed-in user's profile
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;

    const result = await db.execute(sql`
      SELECT
        u.id,
        u.name,
        u.email,
        pp.age,
        pp.gender,
        pp.phone,
        pp.address,
        pp.blood_group,
        pp.allergies,
        pp.existing_conditions
      FROM "user" u
      LEFT JOIN patient_profiles pp ON pp.user_id = u.id
      WHERE u.id = ${userId}
    `);

    const row = result.rows?.[0];
    if (!row) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: row });
  } catch (error) {
    console.error("[GET /api/profile]", error);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}

// PUT /api/profile — upsert the signed-in user's profile
export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;
    const { name, age, gender, phone, address, blood_group, allergies, existing_conditions } = await req.json();

    // Validation
    const validGenders = ["male", "female", "other", "", null, undefined];
    const validBloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "", null, undefined];

    if (gender && !validGenders.includes(gender)) {
      return NextResponse.json({ error: "Invalid gender value." }, { status: 400 });
    }
    if (blood_group && !validBloodGroups.includes(blood_group)) {
      return NextResponse.json({ error: "Invalid blood group value." }, { status: 400 });
    }
    if (age !== undefined && age !== null && age !== "") {
      const n = Number(age);
      if (isNaN(n) || n < 0 || n > 150) {
        return NextResponse.json({ error: "Invalid age." }, { status: 400 });
      }
    }

    if (name) {
      await db.execute(sql`
        UPDATE "user" SET name = ${name}, updated_at = now() WHERE id = ${userId}
      `);
    }

    await db.execute(sql`
      INSERT INTO patient_profiles (
        id, user_id, age, gender, phone, address,
        blood_group, allergies, existing_conditions,
        created_at, updated_at
      )
      VALUES (
        gen_random_uuid()::text,
        ${userId},
        ${age ? Number(age) : null},
        ${gender || null},
        ${phone || null},
        ${address || null},
        ${blood_group || null},
        ${allergies || null},
        ${existing_conditions || null},
        now(),
        now()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        age                 = EXCLUDED.age,
        gender              = EXCLUDED.gender,
        phone               = EXCLUDED.phone,
        address             = EXCLUDED.address,
        blood_group         = EXCLUDED.blood_group,
        allergies           = EXCLUDED.allergies,
        existing_conditions = EXCLUDED.existing_conditions,
        updated_at          = now()
    `);

    return NextResponse.json({ success: true, message: "Profile updated successfully." });
  } catch (error) {
    console.error("[PUT /api/profile]", error);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}