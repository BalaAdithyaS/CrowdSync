export type UserRole = 'USER' | 'LOCATION_ADMIN' | 'ORGANIZATION_ADMIN' | 'PLATFORM_ADMIN';

export type CounterStatus = 'OPEN' | 'CLOSED' | 'PAUSED';

export type QueueStatus = 
  | 'WAITING' 
  | 'APPROACHING' 
  | 'CALLED' 
  | 'SERVING' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type CrowdLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface ServiceCounter {
  id: string;
  location_id: string;
  name: string;
  code: string;
  status: CounterStatus;
  average_service_seconds: number;
  queue_capacity: number;
  active_queue_count: number;
  estimated_wait_minutes: number;
  created_at: string;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  image_url?: string;
  opening_hours: string;
  is_active: boolean;
  low_threshold: number;
  mod_threshold: number;
  crowd_capacity: number;
  crowd_status: CrowdLevel;
  current_wait_minutes: number;
  total_waiting: number;
  active_counters_count: number;
  is_favorite?: boolean;
  counters?: ServiceCounter[];
  created_at: string;
}

export interface QueueSession {
  id: string;
  user_id: string;
  counter_id: string;
  location_id: string;
  location_name: string;
  counter_name: string;
  counter_code: string;
  ticket_number: string;
  sequence_number: number;
  queue_position: number;
  people_ahead: number;
  status: QueueStatus;
  joined_at: string;
  called_at?: string;
  service_started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  estimated_wait_seconds: number;
  estimated_wait_range_min: number;
  estimated_wait_range_max: number;
  estimation_explanation: string;
  is_approximate: boolean;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_queue_id?: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_locations: number;
  active_counters: number;
  current_waiting: number;
  avg_wait_minutes: number;
  completed_today: number;
  cancelled_today: number;
  no_show_today: number;
  longest_queue_count: number;
  longest_queue_location: string;
  is_demo_data: boolean;
}

export interface VolumeTrendPoint {
  hour: string;
  volume: number;
  completed: number;
}

export interface WaitTimeAccuracyPoint {
  time_label: string;
  estimated_minutes: number;
  actual_minutes: number;
}

export interface CounterPerformancePoint {
  counter_name: string;
  location_name: string;
  served_count: number;
  avg_service_minutes: number;
  utilization_percent: number;
}

export interface LocationComparisonPoint {
  location_name: string;
  category: string;
  current_waiting: number;
  avg_wait_minutes: number;
  crowd_status: string;
}

export interface AdminQueueSession {
  id: string;
  ticket_number: string;
  location_id: string;
  location_name: string;
  counter_id: string;
  counter_name: string;
  user_name: string;
  user_email: string;
  queue_position: number;
  status: QueueStatus;
  estimated_wait_seconds: number;
  joined_at: string;
  called_at?: string;
  service_started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}

export interface AuditLogItem {
  id: string;
  actor_user_id?: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id?: string;
  details?: string;
  created_at: string;
}
