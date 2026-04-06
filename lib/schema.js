import {
  pgTable, text, timestamp, boolean,
  serial, integer, doublePrecision
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id:            text("id").primaryKey(),
  name:          text("name").notNull(),
  email:         text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image:         text("image"),
  role:          text("role").notNull().default("patient"),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("session", {
  id:        text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token:     text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("account", {
  id:                    text("id").primaryKey(),
  accountId:             text("account_id").notNull(),
  providerId:            text("provider_id").notNull(),
  userId:                text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken:           text("access_token"),
  refreshToken:          text("refresh_token"),
  idToken:               text("id_token"),
  accessTokenExpiresAt:  timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope:                 text("scope"),
  password:              text("password"),
  createdAt:             timestamp("created_at").notNull().defaultNow(),
  updatedAt:             timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verification", {
  id:         text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value:      text("value").notNull(),
  expiresAt:  timestamp("expires_at").notNull(),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const patientProfiles = pgTable("patient_profiles", {
  id:                    text("id").primaryKey(),
  userId:                text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  age:                   integer("age"),
  gender:                text("gender"),
  phone:                 text("phone"),
  address:               text("address"),
  bloodGroup:            text("blood_group"),
  allergies:             text("allergies"),
  existingConditions:    text("existing_conditions"),
  emergencyContactName:  text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  insuranceProvider:     text("insurance_provider"),
  insuranceId:           text("insurance_id"),
  medications:           text("medications"),
  createdAt:             timestamp("created_at").notNull().defaultNow(),
  updatedAt:             timestamp("updated_at").notNull().defaultNow(),
});

export const hospitals = pgTable("hospitals", {
  id:                 serial("id").primaryKey(),
  name:               text("name").notNull(),
  address:            text("address"),
  city:               text("city"),
  lat:                doublePrecision("lat").notNull(),
  lng:                doublePrecision("lng").notNull(),
  totalBeds:          integer("total_beds").notNull().default(0),
  availableBeds:      integer("available_beds").notNull().default(0),
  icuBeds:            integer("icu_beds").notNull().default(0),
  icuAvailable:       integer("icu_available").notNull().default(0),
  emergencyAvailable: boolean("emergency_available").notNull().default(true),
  departments:        text("departments").array(),
  contactPhone:       text("contact_phone"),
  contactEmail:       text("contact_email"),
  status:             text("status").default("open"),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
});

export const appointments = pgTable("appointments", {
  id:              text("id").primaryKey(),
  userId:          text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  hospitalName:    text("hospital_name").notNull(),
  hospitalAddress: text("hospital_address"),
  department:      text("department").notNull(),
  date:            text("date").notNull(),
  timeSlot:        text("time_slot").notNull(),
  patientName:     text("patient_name").notNull(),
  patientPhone:    text("patient_phone"),
  reason:          text("reason"),
  status:          text("status").notNull().default("confirmed"),
  tokenNumber:     text("token_number"),
  createdAt:       timestamp("created_at").notNull().defaultNow(),
  updatedAt:       timestamp("updated_at").notNull().defaultNow(),
});