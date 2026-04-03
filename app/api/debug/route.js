import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    db_url_exists: !!process.env.db_URL,
    db_url_preview: process.env.db_URL?.substring(0, 40) + "...",
    node_env: process.env.NODE_ENV,
  });
}