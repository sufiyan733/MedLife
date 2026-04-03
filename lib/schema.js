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
  id:                 text("id").primaryKey(),
  userId:             text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  age:                integer("age"),
  gender:             text("gender"),  // 'male' | 'female' | 'other'
  phone:              text("phone"),
  address:            text("address"),
  bloodGroup:         text("blood_group"),  // 'A+' | 'A-' | etc.
  allergies:          text("allergies"),
  existingConditions: text("existing_conditions"),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
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