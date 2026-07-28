/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Companion {
  id: string;
  name: string;
  menuPreference: string;
  dietaryRequirements: string;
}

export interface GuestbookPhoto {
  id: string;
  url: string;
  uploader: string;
  caption?: string;
  timestamp: string;
}

export interface RSVPGuest {
  id: string;
  name: string;
  attending: 'yes' | 'no' | 'maybe';
  menuPreference: string;
  dietaryRequirements: string;
  companions: Companion[];
  weddingMessage: string;
  timestamp: string;
}

export interface VenueInfo {
  name: string;
  address: string;
  time: string;
  latitude: number;
  longitude: number;
  description: string;
}

export interface WeddingConfig {
  sposoName: string;
  sposaName: string;
  weddingDate: string; // ISO String like '2026-09-12T15:30:00'
  venueCeremony: VenueInfo;
  venueReception: VenueInfo;
  welcomeMessage: string;
  ourStory: string;
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  type: 'RSVP_CREATED' | 'RSVP_UPDATED' | 'RSVP_DELETED' | 'RSVP_CLEARED' | 'CONFIG_UPDATED' | 'PHOTO_ADDED' | 'PHOTO_DELETED' | 'ADMIN_ACCESS' | 'GUEST_LIST_UPLOADED' | 'SYSTEM_RESET';
  description: string;
  details?: any;
}

export interface GuestListEntry {
  id: string;
  nome: string;
  cognome: string;
  cell: string;
  email: string;
}


