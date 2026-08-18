import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const siteUsers = sqliteTable(
  "site_users",
  {
    id: text("id").primaryKey(),
    authUserId: text("auth_user_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    locale: text("locale").notNull().default("en"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_site_users_auth_user_id").on(table.authUserId),
    index("idx_site_users_email").on(table.email),
  ],
);

export const customerEnquiries = sqliteTable(
  "customer_enquiries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    businessId: text("business_id").notNull(),
    businessName: text("business_name").notNull(),
    requirement: text("requirement").notNull(),
    preferredDate: text("preferred_date").notNull(),
    customerName: text("customer_name").notNull(),
    phoneEncrypted: text("phone_encrypted").notNull(),
    phoneFingerprint: text("phone_fingerprint").notNull(),
    contactPreference: text("contact_preference").notNull(),
    consentGranted: integer("consent_granted", { mode: "boolean" }).notNull(),
    status: text("status").notNull().default("submitted"),
    approximateLatitude: real("approximate_latitude"),
    approximateLongitude: real("approximate_longitude"),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_customer_enquiries_business_created").on(table.businessId, table.createdAt),
    index("idx_customer_enquiries_status_expires").on(table.status, table.expiresAt),
    index("idx_customer_enquiries_fingerprint_created").on(table.phoneFingerprint, table.createdAt),
  ],
);

export const savedBusinesses = sqliteTable(
  "saved_businesses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    businessId: text("business_id").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_saved_businesses_user_business").on(table.userId, table.businessId),
    index("idx_saved_businesses_user").on(table.userId),
  ],
);

export const businessClaims = sqliteTable(
  "business_claims",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    businessName: text("business_name").notNull(),
    ownerName: text("owner_name").notNull(),
    phoneEncrypted: text("phone_encrypted").notNull(),
    proofObjectKey: text("proof_object_key"),
    status: text("status").notNull().default("pending"),
    reviewerNotes: text("reviewer_notes"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_business_claims_status_created").on(table.status, table.createdAt),
    index("idx_business_claims_user").on(table.userId),
  ],
);

export const businessApplications = sqliteTable(
  "business_applications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    applicationType: text("application_type").notNull(),
    businessName: text("business_name").notNull(),
    ownerName: text("owner_name").notNull(),
    category: text("category").notNull(),
    city: text("city").notNull(),
    locality: text("locality").notNull(),
    phoneEncrypted: text("phone_encrypted").notNull(),
    phoneFingerprint: text("phone_fingerprint").notNull(),
    proofObjectKey: text("proof_object_key"),
    requestedPlan: text("requested_plan").notNull().default("free"),
    status: text("status").notNull().default("pending"),
    consentGranted: integer("consent_granted", { mode: "boolean" }).notNull(),
    reviewerNotes: text("reviewer_notes"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_business_applications_status_created").on(table.status, table.createdAt),
    index("idx_business_applications_fingerprint").on(table.phoneFingerprint),
    index("idx_business_applications_user").on(table.userId),
  ],
);

export const contactRequests = sqliteTable(
  "contact_requests",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    topic: text("topic").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("open"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_contact_requests_status_created").on(table.status, table.createdAt),
    index("idx_contact_requests_email_created").on(table.email, table.createdAt),
  ],
);

export const appWaitlist = sqliteTable(
  "app_waitlist",
  {
    id: text("id").primaryKey(),
    phoneEncrypted: text("phone_encrypted").notNull(),
    phoneFingerprint: text("phone_fingerprint").notNull(),
    locale: text("locale").notNull().default("en"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("idx_app_waitlist_phone_fingerprint").on(table.phoneFingerprint)],
);
