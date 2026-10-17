import { z } from 'zod';

export const STATUSES = [
  'Shipment Registered', 'Processing', 'Picked Up', 'In Transit',
  'Arrived at Sorting Facility', 'Customs Clearance', 'On Hold',
  'Out for Delivery', 'Delivered', 'Delivery Exception',
] as const;

export const email = z.string().trim().toLowerCase().email('Invalid email address');
export const password = z.string().min(8, 'Password must be at least 8 characters');

export const registerSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email,
  password,
  phone: z.string().trim().max(30).optional().or(z.literal('')),
});

export const loginSchema = z.object({ email, password: z.string().min(1) });

export const trackSchema = z.object({
  trackingNumber: z.string().trim().min(4).max(40),
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
});

export const shipmentCreateSchema = z.object({
  user_email: email.optional().or(z.literal('')),
  sender_name: z.string().trim().min(2).max(120),
  sender_contact: z.string().trim().min(3).max(160),
  recipient_name: z.string().trim().min(2).max(120),
  recipient_contact: z.string().trim().min(3).max(160),
  origin: z.string().trim().min(2).max(120),
  destination: z.string().trim().min(2).max(120),
  service_type: z.enum(['air_freight', 'sea_freight', 'road_transport', 'express', 'standard']).default('standard'),
  package_description: z.string().trim().max(500).optional().or(z.literal('')),
  weight_kg: z.number().positive().max(50000).optional().nullable(),
  estimated_delivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export const shipmentUpdateSchema = shipmentCreateSchema.partial();

export const eventSchema = z.object({
  status: z.enum(STATUSES),
  description: z.string().trim().min(3).max(400),
  location: z.string().trim().max(120).optional().or(z.literal('')),
});

export const holdSchema = z.object({
  reason: z.string().trim().min(3).max(300),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  charge_description: z.string().trim().max(300).optional().or(z.literal('')),
  charge_amount: z.number().nonnegative().max(1_000_000).optional(),
});

export const releaseSchema = z.object({
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const chargeSchema = z.object({
  description: z.string().trim().min(3).max(300),
  amount: z.number().positive().max(1_000_000),
  currency: z.string().trim().length(3).default('USD'),
});

export const paymentSchema = z.object({
  method: z.string().trim().min(2).max(60),
  reference: z.string().trim().min(2).max(100),
});

export const chatStartSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: email.optional().or(z.literal('')),
});

export const chatMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export function validate<T>(schema: z.ZodType<T>, data: unknown): T | { error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { error: issue ? `${issue.path.join('.') || 'input'}: ${issue.message}` : 'Invalid input' };
  }
  return result.data;
}
