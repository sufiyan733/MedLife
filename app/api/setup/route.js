import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function runSetup() {
  await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "user" (
        id             text PRIMARY KEY,
        name           text NOT NULL,
        email          text NOT NULL UNIQUE,
        email_verified boolean NOT NULL DEFAULT false,
        image          text,
        role           text NOT NULL DEFAULT 'patient',
        created_at     timestamp NOT NULL DEFAULT now(),
        updated_at     timestamp NOT NULL DEFAULT now()
      )
    `);

  await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" (
        id          text PRIMARY KEY,
        user_id     text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        token       text NOT NULL UNIQUE,
        expires_at  timestamp NOT NULL,
        ip_address  text,
        user_agent  text,
        created_at  timestamp NOT NULL DEFAULT now(),
        updated_at  timestamp NOT NULL DEFAULT now()
      )
    `);

  await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "account" (
        id                       text PRIMARY KEY,
        user_id                  text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        account_id               text NOT NULL,
        provider_id              text NOT NULL,
        access_token             text,
        refresh_token            text,
        id_token                 text,
        password                 text,
        access_token_expires_at  timestamp,
        refresh_token_expires_at timestamp,
        scope                    text,
        created_at               timestamp NOT NULL DEFAULT now(),
        updated_at               timestamp NOT NULL DEFAULT now()
      )
    `);

  await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "verification" (
        id         text PRIMARY KEY,
        identifier text NOT NULL,
        value      text NOT NULL,
        expires_at timestamp NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      )
    `);

  await db.execute(sql`
      CREATE TABLE IF NOT EXISTS patient_profiles (
        id                      text PRIMARY KEY,
        user_id                 text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE UNIQUE,
        age                     integer,
        gender                  text CHECK (gender IN ('male', 'female', 'other')),
        phone                   text,
        address                 text,
        blood_group             text CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')),
        allergies               text,
        existing_conditions     text,
        emergency_contact_name  text,
        emergency_contact_phone text,
        insurance_provider      text,
        insurance_id            text,
        medications             text,
        created_at              timestamp NOT NULL DEFAULT now(),
        updated_at              timestamp NOT NULL DEFAULT now()
      )
    `);

  await db.execute(sql`
      ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS emergency_contact_name text;
      ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
      ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS insurance_provider text;
      ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS insurance_id text;
      ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS medications text;
    `);

  await db.execute(sql`
      CREATE TABLE IF NOT EXISTS hospitals (
        id                  SERIAL PRIMARY KEY,
        name                TEXT NOT NULL,
        address             TEXT,
        city                TEXT,
        lat                 DOUBLE PRECISION NOT NULL,
        lng                 DOUBLE PRECISION NOT NULL,
        total_beds          INT NOT NULL DEFAULT 0,
        available_beds      INT NOT NULL DEFAULT 0,
        icu_beds            INT NOT NULL DEFAULT 0,
        icu_available       INT NOT NULL DEFAULT 0,
        emergency_available BOOLEAN NOT NULL DEFAULT true,
        departments         TEXT[],
        contact_phone       TEXT,
        contact_email       TEXT,
        status              TEXT DEFAULT 'open',
        created_at          TIMESTAMP NOT NULL DEFAULT now(),
        updated_at          TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

  await db.execute(sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id              text PRIMARY KEY,
        user_id         text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        hospital_name   text NOT NULL,
        hospital_address text,
        department      text NOT NULL,
        date            text NOT NULL,
        time_slot       text NOT NULL,
        patient_name    text NOT NULL,
        patient_phone   text,
        reason          text,
        status          text NOT NULL DEFAULT 'confirmed',
        token_number    text,
        created_at      timestamp NOT NULL DEFAULT now(),
        updated_at      timestamp NOT NULL DEFAULT now()
      )
    `);
}

export async function GET() {
  try {
    await runSetup();
    return NextResponse.json({
      success: true,
      message: "All 7 tables created (including appointments)!",
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    await runSetup();
    return NextResponse.json({
      success: true,
      message: "All 7 tables created (including appointments)!",
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}