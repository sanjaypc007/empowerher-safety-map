
export interface User {
  id: string;
  email: string;
  name?: string;
  emergencyContacts?: EmergencyContact[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  email?: string;  // Add email property which is optional
}

export interface SafetyReport {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  rating: number; // 1-5 stars
  incidentType?: string; // e.g. "Harassment", "Poor Lighting"
  description?: string;
  timestamp: Date;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Route {
  id: string;
  startLocation: Location;
  endLocation: Location;
  waypoints: RouteSegment[];
}

export interface RouteSegment {
  id: string;
  startLocation: Location;
  endLocation: Location;
  safetyLevel: SafetyLevel;
  distance: number;
}

export enum SafetyLevel {
  HIGH_RISK = "HIGH_RISK",
  MEDIUM_RISK = "MEDIUM_RISK",
  SAFE = "SAFE"
}

export interface TabItem {
  label: string;
  value: string;
  icon: React.ReactNode;
}
