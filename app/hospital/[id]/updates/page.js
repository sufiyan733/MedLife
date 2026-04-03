import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import UpdateHospitalForm from "./UpdateHospitalForm";

export default async function HospitalUpdatesPage({ params }) {
  const { id } = await params;

  const result = await db.execute(sql`
    SELECT
      id, name,
      total_beds, available_beds,
      icu_beds, icu_available,
      emergency_available,
      departments,
      contact_phone, contact_email,
      status
    FROM hospitals
    WHERE id = ${id}
    LIMIT 1
  `);

  const hospital = result.rows?.[0];
  if (!hospital) notFound();

  return <UpdateHospitalForm hospital={hospital} />;
}