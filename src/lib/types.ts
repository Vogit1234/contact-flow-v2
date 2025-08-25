export interface User {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Edit' | 'View';
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  mobilePhone: string;
  workPhone: string;
  fax: string;
  website: string;
  address: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface IPRestrictionSettings {
  id?: string;
  enabled: boolean;
  allowedRanges: string[];
  description?: string;
  updatedAt: Date;
  updatedBy: string;
}