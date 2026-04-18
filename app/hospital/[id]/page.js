import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import HospitalDetailClient from "./HospitalDetailClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const result = await db.execute(sql`SELECT name, city FROM hospitals WHERE id = ${id} LIMIT 1`);
  const h = result.rows?.[0];
  if (!h) return { title: "Hospital Not Found — MediLife" };
  return {
    title: `${h.name} — MediLife`,
    description: `View real-time bed availability, departments, and book appointments at ${h.name}, ${h.city}.`,
  };
}

export default async function HospitalDetailPage({ params }) {
  const { id } = await params;

  const result = await db.execute(sql`
    SELECT
      id, name, address, city, lat, lng,
      total_beds, available_beds, icu_beds, icu_available,
      emergency_available, departments,
      contact_phone, contact_email, status,
      created_at, updated_at
    FROM hospitals
    WHERE id = ${id}
    LIMIT 1
  `);

  const hospital = result.rows?.[0];
  if (!hospital) notFound();

  // Fetch recent appointments for this hospital
  const apptsResult = await db.execute(sql`
    SELECT COUNT(*) as count FROM appointments WHERE hospital_name = ${hospital.name}
  `);
  const totalAppointments = parseInt(apptsResult.rows?.[0]?.count || 0);

  return <HospitalDetailClient hospital={hospital} totalAppointments={totalAppointments} />;
}
