export const STATUSES = [
  'Shipment Registered', 'Processing', 'Picked Up', 'In Transit',
  'Arrived at Sorting Facility', 'Customs Clearance', 'On Hold',
  'Out for Delivery', 'Delivered', 'Delivery Exception',
] as const;
export type Status = (typeof STATUSES)[number];

export interface Charge {
  id?: number;
  description: string;
  amount: number | string;
  currency: string;
  status: 'pending' | 'paid' | 'waived';
  created_at?: string;
  paid_at?: string;
  tracking_number?: string;
}

export interface ShipmentEvent {
  id?: number;
  status: Status | string;
  description: string;
  location?: string | null;
  created_at: string;
}

export interface Shipment {
  id: number;
  tracking_number: string;
  user_id?: number | null;
  sender_name?: string;
  sender_contact?: string;
  recipient_name?: string;
  recipient_contact?: string;
  origin: string;
  destination: string;
  service_type: string;
  package_description?: string | null;
  weight_kg?: number | string | null;
  status: Status | string;
  hold_reason?: string | null;
  hold_notes?: string | null;
  estimated_delivery?: string | null;
  delivered_at?: string | null;
  created_at: string;
  pending_charges?: number;
  events?: ShipmentEvent[];
  charges?: Charge[];
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string | null;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender: 'customer' | 'agent';
  sender_name: string;
  body: string;
  created_at: string;
}
