import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

// GET /api/admin/users — fetch all users for admin panel
export async function GET() {
  try {
    const result = await db.execute(sql`
      SELECT
        id, name, email, image,
        created_at, updated_at
      FROM "user"
      ORDER BY created_at DESC
      LIMIT 100
    `);

    // Count appointments per user
    const users = await Promise.all(
      (result.rows || []).map(async (user) => {
        const apptResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM appointments WHERE user_id = ${user.id}
        `);
        return {
          ...user,
          appts: parseInt(apptResult.rows?.[0]?.count || 0),
          role: user.email?.includes("admin") || user.email?.includes("medilife") ? "admin" : "patient",
          avatar: (user.name || "U")
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      users,
      count: users.length,
    });
  } catch (error) {
    console.error("[GET /api/admin/users] Error:", error);
    return NextResponse.json({
      success: false,
      users: [],
      count: 0,
    });
  }
}
