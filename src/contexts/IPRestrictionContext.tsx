import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import type { IPRestrictionSettings } from '../lib/types';

interface IPRestrictionContextType {
  ipSettings: IPRestrictionSettings | null;
  loading: boolean;
  updateIPSettings: (settings: Partial<IPRestrictionSettings>) => Promise<void>;
  isAccessRestricted: boolean;
  recheckAccess: () => Promise<void>;
}

const IPRestrictionContext = createContext<IPRestrictionContextType | undefined>(undefined);

export function useIPRestriction() {
  const context = useContext(IPRestrictionContext);
  if (context === undefined) {
    throw new Error('useIPRestriction must be used within an IPRestrictionProvider');
  }
  return context;
}

export function IPRestrictionProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile } = useAuth();
  const [ipSettings, setIPSettings] = useState<IPRestrictionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAccessRestricted, setIsAccessRestricted] = useState(false);

  // Load IP restriction settings from Firestore
  const loadIPSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'ipRestrictions'));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setIPSettings({
          id: settingsDoc.id,
          enabled: data.enabled || false,
          allowedRanges: data.allowedRanges || [],
          description: data.description || '',
          updatedAt: data.updatedAt?.toDate() || new Date(),
          updatedBy: data.updatedBy || ''
        });
      } else {
        // Create default settings if none exist
        const defaultSettings: IPRestrictionSettings = {
          enabled: false,
          allowedRanges: ['127.0.0.1', '192.168.0.0/16', '10.0.0.0/8'],
          description: 'Default IP restriction settings',
          updatedAt: new Date(),
          updatedBy: currentUser?.uid || 'system'
        };
        
        await setDoc(doc(db, 'settings', 'ipRestrictions'), defaultSettings);
        setIPSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading IP settings:', error);
      // Set safe defaults if loading fails
      setIPSettings({
        enabled: false,
        allowedRanges: [],
        description: 'Error loading settings',
        updatedAt: new Date(),
        updatedBy: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update IP restriction settings
  const updateIPSettings = async (updates: Partial<IPRestrictionSettings>) => {
    if (!currentUser || !ipSettings) return;

    try {
      const updatedSettings: IPRestrictionSettings = {
        ...ipSettings,
        ...updates,
        updatedAt: new Date(),
        updatedBy: currentUser.uid
      };

      await setDoc(doc(db, 'settings', 'ipRestrictions'), updatedSettings);
      setIPSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating IP settings:', error);
      throw error;
    }
  };

  // Check if access should be restricted for current user
  const checkAccessRestriction = async () => {
    console.log('Checking access restriction...', { userProfile, ipSettings });
    
    if (!userProfile || !ipSettings) {
      console.log('No user profile or IP settings, allowing access');
      setIsAccessRestricted(false);
      return;
    }

    // Admin users are never restricted
    if (userProfile.role === 'Admin') {
      console.log('Admin user, allowing access');
      setIsAccessRestricted(false);
      return;
    }

    // If IP restrictions are disabled, don't restrict
    if (!ipSettings.enabled) {
      console.log('IP restrictions disabled, allowing access');
      setIsAccessRestricted(false);
      return;
    }

    try {
      const { shouldRestrictAccess } = await import('../lib/ipUtils');
      const restricted = await shouldRestrictAccess(userProfile.role, ipSettings.allowedRanges);
      console.log('IP restriction check result:', restricted);
      setIsAccessRestricted(restricted);
    } catch (error) {
      console.error('Error checking IP restrictions:', error);
      // In case of error, don't restrict to prevent lockout
      setIsAccessRestricted(false);
    }
  };

  // Load settings when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      loadIPSettings();
    }
  }, [currentUser]);

  // Check access restrictions when user profile or settings change
  useEffect(() => {
    if (userProfile && ipSettings) {
      checkAccessRestriction();
    }
  }, [userProfile, ipSettings]);

  // Manual function to recheck access (for retry functionality)
  const recheckAccess = async () => {
    console.log('recheckAccess called, reloading IP settings first...');
    // Reload IP settings first to get the latest configuration
    await loadIPSettings();
    // Then check access restrictions
    await checkAccessRestriction();
  };

  const value = {
    ipSettings,
    loading,
    updateIPSettings,
    isAccessRestricted,
    recheckAccess
  };

  return (
    <IPRestrictionContext.Provider value={value}>
      {children}
    </IPRestrictionContext.Provider>
  );
}