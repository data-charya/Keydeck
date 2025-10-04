"use client"

import { useState, useCallback, useEffect } from "react"
import { 
  connectionProfilesStorage, 
  createConnectionProfile, 
  generateProfileId,
  type ConnectionProfile 
} from "@/lib/connection-profiles-storage"
import { useToast } from "@/hooks/use-toast"

interface EncryptedProfilesState {
  profiles: Omit<ConnectionProfile, 'password' | 'username'>[]
  isLoading: boolean
  isAvailable: boolean
  hasPassphrase: boolean
  currentPassphrase: string | null
}

export function useEncryptedProfiles() {
  const [state, setState] = useState<EncryptedProfilesState>({
    profiles: [],
    isLoading: true, // Start with loading true to prevent flash
    isAvailable: false,
    hasPassphrase: false,
    currentPassphrase: null,
  })
  
  const { toast } = useToast()

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        // Add minimum loading time to prevent flash
        const [isAvailable] = await Promise.all([
          connectionProfilesStorage.isAvailable(),
          new Promise(resolve => setTimeout(resolve, 500)) // Minimum 300ms loading
        ])
        
        setState(prev => ({ ...prev, isAvailable, isLoading: false }))
        
        if (isAvailable) {
          // Try to load profiles without passphrase first (to see if any exist)
          await loadProfilesList()
        }
      } catch (error) {
        console.error('Failed to check encrypted profiles availability:', error)
        setState(prev => ({ ...prev, isAvailable: false, isLoading: false }))
      }
    }

    checkAvailability()
  }, [])

  /**
   * Load profiles list (without decryption)
   */
  const loadProfilesList = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      const profiles = await connectionProfilesStorage.listProfiles()
      setState(prev => ({ 
        ...prev, 
        profiles, 
        isLoading: false,
        hasPassphrase: profiles.length > 0
      }))
    } catch (error) {
      console.error('Failed to load profiles list:', error)
      setState(prev => ({ ...prev, isLoading: false }))
      toast({
        title: "Failed to load profiles",
        description: "Could not load saved connection profiles",
        variant: "destructive",
      })
    }
  }, [toast])

  /**
   * Set passphrase and load full profiles
   */
  const setPassphrase = useCallback(async (passphrase: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // Try to load a profile to validate the passphrase BEFORE setting it
      if (state.profiles.length > 0) {
        try {
          await connectionProfilesStorage.loadProfile(state.profiles[0].id, passphrase)
        } catch (error) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false
          }))
          throw new Error("Invalid passphrase")
        }
      }
      
      // Only set the passphrase after successful validation
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        currentPassphrase: passphrase,
        hasPassphrase: true
      }))
      
      toast({
        title: "Passphrase accepted",
        description: "Successfully unlocked your connection profiles",
      })
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false
      }))
      throw error
    }
  }, [state.profiles, toast])

  /**
   * Save a new connection profile
   */
  const saveProfile = useCallback(async (
    config: any, 
    name: string, 
    passphrase: string,
    id?: string
  ) => {
    if (!state.currentPassphrase && !passphrase) {
      throw new Error("Passphrase is required to save profiles")
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      const profile = createConnectionProfile(config, name, id)
      const profilePassphrase = passphrase || state.currentPassphrase!
      
      await connectionProfilesStorage.saveProfile(profile, profilePassphrase)
      
      // Reload profiles list
      await loadProfilesList()
      
      toast({
        title: "Profile saved",
        description: `Connection profile "${name}" has been saved securely`,
      })
      
      return profile.id
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      console.error('Failed to save profile:', error)
      throw error
    }
  }, [state.currentPassphrase, loadProfilesList, toast])

  /**
   * Load a specific profile with decryption
   */
  const loadProfile = useCallback(async (profileId: string) => {
    if (!state.currentPassphrase) {
      throw new Error("Passphrase is required to load profiles")
    }

    try {
      setState(prev => ({ ...prev, isLoading: true }))
      const profile = await connectionProfilesStorage.loadProfile(profileId, state.currentPassphrase)
      setState(prev => ({ ...prev, isLoading: false }))
      return profile
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      console.error('Failed to load profile:', error)
      throw error
    }
  }, [state.currentPassphrase])

  /**
   * Delete a profile
   */
  const deleteProfile = useCallback(async (profileId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      await connectionProfilesStorage.deleteProfile(profileId)
      
      // Reload profiles list
      await loadProfilesList()
      
      toast({
        title: "Profile deleted",
        description: "Connection profile has been deleted",
      })
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      console.error('Failed to delete profile:', error)
      toast({
        title: "Failed to delete profile",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }, [loadProfilesList, toast])

  /**
   * Update profile metadata
   */
  const updateProfileMetadata = useCallback(async (
    profileId: string, 
    updates: {
      name?: string
      lastConnected?: Date
      isConnected?: boolean
    }
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      await connectionProfilesStorage.updateProfileMetadata(profileId, updates)
      
      // Reload profiles list
      await loadProfilesList()
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      
      // Check if this is a "profile not found" error (expected after clearing data)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      if (errorMessage.includes('Profile not found')) {
        return // Don't show error toast for expected scenario
      }
      
      // Only show error toast for unexpected errors
      console.error('Failed to update profile metadata:', error)
      toast({
        title: "Failed to update profile",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }, [loadProfilesList, toast])

  /**
   * Change passphrase for all profiles
   */
  const changePassphrase = useCallback(async (oldPassphrase: string, newPassphrase: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      
      // Load all profiles with old passphrase
      const profilesToReencrypt: ConnectionProfile[] = []
      for (const profileMeta of state.profiles) {
        try {
          const profile = await connectionProfilesStorage.loadProfile(profileMeta.id, oldPassphrase)
          if (profile) {
            profilesToReencrypt.push(profile)
          }
        } catch (error) {
          console.error(`Failed to load profile ${profileMeta.id} for re-encryption:`, error)
        }
      }
      
      // Clear all profiles
      await connectionProfilesStorage.clearAllProfiles()
      
      // Re-save all profiles with new passphrase
      for (const profile of profilesToReencrypt) {
        await connectionProfilesStorage.saveProfile(profile, newPassphrase)
      }
      
      // Update state
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        currentPassphrase: newPassphrase
      }))
      
      // Reload profiles list
      await loadProfilesList()
      
      toast({
        title: "Passphrase changed",
        description: "All connection profiles have been re-encrypted with the new passphrase",
      })
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      console.error('Failed to change passphrase:', error)
      throw error
    }
  }, [state.profiles, loadProfilesList, toast])

  /**
   * Clear all profiles
   */
  const clearAllProfiles = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }))
      await connectionProfilesStorage.clearAllProfiles()
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        profiles: [],
        hasPassphrase: false,
        currentPassphrase: null
      }))
      
      toast({
        title: "All profiles cleared",
        description: "All connection profiles have been deleted",
      })
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      console.error('Failed to clear all profiles:', error)
      toast({
        title: "Failed to clear profiles",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }, [toast])

  /**
   * Get storage statistics
   */
  const getStorageStats = useCallback(async () => {
    try {
      return await connectionProfilesStorage.getStorageStats()
    } catch (error) {
      console.error('Failed to get storage stats:', error)
      return {
        profileCount: 0,
        totalSize: 0,
        isAvailable: false
      }
    }
  }, [])

  /**
   * Clear passphrase from memory
   */
  const clearPassphrase = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentPassphrase: null,
      hasPassphrase: false
    }))
  }, [])

  return {
    // State
    profiles: state.profiles,
    isLoading: state.isLoading,
    isAvailable: state.isAvailable,
    hasPassphrase: state.hasPassphrase,
    isUnlocked: !!state.currentPassphrase,
    
    // Actions
    setPassphrase,
    saveProfile,
    loadProfile,
    deleteProfile,
    updateProfileMetadata,
    changePassphrase,
    clearAllProfiles,
    clearPassphrase,
    getStorageStats,
    loadProfilesList,
  }
}
