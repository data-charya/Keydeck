"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Database, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Lock, 
  Unlock,
  Shield,
  Key,
  Clock,
  Server,
  Activity,
  AlertCircle,
  CheckCircle,
  Settings,
  Download,
  Upload
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEncryptedProfiles } from "@/hooks/use-encrypted-profiles"
import { useConnectionMask } from "@/hooks/use-connection-mask"
import { PassphraseDialog } from "@/components/passphrase-dialog"
import { CreateProfileWizard } from "@/components/create-profile-wizard"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { RedisConfig } from "@/lib/redis-uri"

interface EncryptedProfilesManagerProps {
  onConnect: (config: RedisConfig, name?: string, profileId?: string) => Promise<void>
  onSwitchConnection: (connectionId: string) => Promise<void>
  activeConnectionId?: string
}

export function EncryptedProfilesManager({ 
  onConnect, 
  onSwitchConnection,
  activeConnectionId 
}: EncryptedProfilesManagerProps) {
  const [showPassphraseDialog, setShowPassphraseDialog] = useState(false)
  const [showCreateProfileDialog, setShowCreateProfileDialog] = useState(false)
  const [showEditProfileDialog, setShowEditProfileDialog] = useState(false)
  const [showChangePassphraseDialog, setShowChangePassphraseDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [editingProfile, setEditingProfile] = useState<any>(null)
  const [passphraseMode, setPassphraseMode] = useState<'create' | 'enter' | 'change'>('enter')
  const [tempPassphrase, setTempPassphrase] = useState<string | null>(null)
  // No need for userDismissedDialog state since we don't auto-popup anymore
  const [passphraseError, setPassphraseError] = useState<string | null>(null)
  
  const { toast } = useToast()
  const {
    profiles,
    isLoading,
    isAvailable,
    hasPassphrase,
    isUnlocked,
    unlockExpiresAt,
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
    getRemainingUnlockTime,
  } = useEncryptedProfiles()
  
  const [remainingTime, setRemainingTime] = useState<number>(0)
  
  const {
    isConnecting,
    connectionProgress,
    connectionError,
    maskConnection,
    clearError,
  } = useConnectionMask()

  // No automatic popup - only show when user explicitly clicks unlock

  // Refresh profiles when active connection changes to update highlighting
  useEffect(() => {
    if (isUnlocked && activeConnectionId) {
      loadProfilesList()
    }
  }, [activeConnectionId, isUnlocked, loadProfilesList])
  
  // Timer countdown and auto-lock effect
  useEffect(() => {
    if (!isUnlocked || !unlockExpiresAt) {
      setRemainingTime(0)
      return
    }
    
    // Update remaining time immediately
    const updateTime = () => {
      const remaining = getRemainingUnlockTime()
      setRemainingTime(remaining)
      
      // Auto-lock when time expires
      if (remaining <= 0 && isUnlocked) {
        clearPassphrase()
        toast({
          title: "Profiles locked",
          description: "Your connection profiles have been automatically locked after 10 minutes",
        })
      }
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [isUnlocked, unlockExpiresAt, getRemainingUnlockTime, clearPassphrase, toast])

  // No need to reset dismissal flag since we don't auto-popup anymore

  const handlePassphraseConfirm = async (passphrase: string) => {
    try {
      if (passphraseMode === 'change') {
        if (!tempPassphrase) {
          setTempPassphrase(passphrase)
          setPassphraseMode('enter')
          return
        }
        
        await changePassphrase(tempPassphrase, passphrase)
        setTempPassphrase(null)
        setShowChangePassphraseDialog(false)
        toast({
          title: "Passphrase changed",
          description: "All profiles have been re-encrypted with the new passphrase",
        })
      } else {
        await setPassphrase(passphrase)
        setShowPassphraseDialog(false)
        // No need to reset dismissal flag since we don't auto-popup anymore
        toast({
          title: "Profiles unlocked",
          description: "Your encrypted connection profiles are now accessible",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      
      // Provide specific error messages for common scenarios
      let userFriendlyMessage = "Invalid passphrase"
      if (errorMessage.includes("Invalid passphrase") || errorMessage.includes("decryption")) {
        userFriendlyMessage = "Incorrect passphrase. Please check your password and try again."
      } else if (errorMessage.includes("corrupted") || errorMessage.includes("malformed")) {
        userFriendlyMessage = "Profile data appears to be corrupted. You may need to recreate your profiles."
      } else if (errorMessage.includes("quota") || errorMessage.includes("storage")) {
        userFriendlyMessage = "Storage quota exceeded. Please clear some profiles or check your browser storage."
      }
      
      // Set error state for the dialog
      setPassphraseError(userFriendlyMessage)
    }
  }

  const handlePassphraseClose = () => {
    setShowPassphraseDialog(false)
    setShowChangePassphraseDialog(false)
    setTempPassphrase(null)
    setPassphraseError(null) // Clear any error state
    
    // Only clear passphrase if user is connected (not when disconnected)
    // This allows re-unlocking when disconnected
    if (hasPassphrase && !isUnlocked && profiles.length > 0 && activeConnectionId) {
      clearPassphrase()
    }
  }

  const handleCreateProfile = async (config: RedisConfig, connectionName: string, passphrase: string) => {
    try {
      // If not unlocked, set the passphrase first
      if (!isUnlocked && passphrase) {
        await setPassphrase(passphrase)
      }

      const profileName = connectionName || 'New Connection'
      const profileId = await saveProfile(config, profileName, '')
      setShowCreateProfileDialog(false)
      
      // Connect to the new profile with masking
      await maskConnection(onConnect, config, profileName, profileId)
      
      toast({
        title: "Profile created",
        description: `Connection profile "${profileName}" has been created successfully`,
      })
    } catch (error) {
      toast({
        title: "Failed to save profile",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
      throw error // Re-throw to let wizard handle it
    }
  }

  const handleConnectToProfile = async (profileId: string) => {
    try {
      const profile = await loadProfile(profileId)
      if (profile) {
        // Connect with masking
        await maskConnection(onConnect, profile, profile.name, profileId)
        
        // Show success message
        toast({
          title: "Connected",
          description: `Successfully connected to ${profile.name}`,
        })
      }
    } catch (error) {
      toast({
        title: "Failed to connect",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleEditProfile = async (profileId: string) => {
    try {
      const profile = await loadProfile(profileId)
      if (profile) {
        setEditingProfile(profile)
        setShowEditProfileDialog(true)
      }
    } catch (error) {
      toast({
        title: "Failed to load profile",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleUpdateProfile = async (config: RedisConfig, connectionName: string, passphrase: string) => {
    try {
      if (!editingProfile) return

      // If passphrase is provided and we're not unlocked, set it
      if (!isUnlocked && passphrase) {
        await setPassphrase(passphrase)
      }

      const profileName = connectionName || editingProfile.name
      // Save with the same ID to update
      await saveProfile(config, profileName, '', editingProfile.id)
      setShowEditProfileDialog(false)
      setEditingProfile(null)
      
      toast({
        title: "Profile updated",
        description: `Connection profile "${profileName}" has been updated`,
      })
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
      throw error // Re-throw to let wizard handle it
    }
  }

  const handleDeleteProfile = async (profileId: string, profileName: string) => {
    if (confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
      await deleteProfile(profileId)
    }
  }

  const handleChangePassphrase = () => {
    setPassphraseMode('change')
    setTempPassphrase(null)
    setShowChangePassphraseDialog(true)
  }

  const handleClearAllProfiles = async () => {
    if (confirm("Are you sure you want to delete ALL connection profiles? This action cannot be undone.")) {
      await clearAllProfiles()
    }
  }

  const handleLockProfiles = () => {
    clearPassphrase()
    toast({
      title: "Profiles locked",
      description: "Connection profiles have been locked. Enter your passphrase to unlock them.",
    })
  }

  const formatLastConnected = (date?: Date) => {
    if (!date) return "Never"
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return "Just now"
  }
  
  const formatRemainingTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    if (minutes > 0) {
      return `${minutes} min${minutes > 1 ? 's' : ''} ${seconds}s`
    }
    return `${seconds}s`
  }

  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Encrypted Connection Profiles
          </CardTitle>
          <CardDescription>
            Encrypted connection profiles stored locally with client-side encryption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Encrypted connection profiles are not available in this environment. 
              This feature requires a modern browser with IndexedDB and Web Crypto API support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Encrypted Connection Profiles
                {isUnlocked && <CheckCircle className="w-4 h-4 text-green-500" />}
              </CardTitle>
              <CardDescription>
                {isUnlocked 
                  ? (
                    <div className="flex items-center gap-2">
                      <span>Your connection profiles are unlocked and ready to use</span>
                      {remainingTime > 0 && (
                        <Badge 
                          variant="secondary" 
                          className={`flex items-center gap-1 ${
                            remainingTime < 60000 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : ''
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          Auto-lock in {formatRemainingTime(remainingTime)}
                        </Badge>
                      )}
                    </div>
                  )
                  : "Enter your passphrase to unlock your encrypted connection profiles"
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isUnlocked ? (
                <Button variant="outline" size="sm" onClick={handleLockProfiles}>
                  <Lock className="w-4 h-4 mr-2" />
                  Lock
                </Button>
              ) : profiles.length > 0 ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="hover:cursor-pointer"
                  onClick={() => {
                    setPassphraseMode('enter')
                    setPassphraseError(null) // Clear any previous errors
                    setShowPassphraseDialog(true)
                  }}
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Unlock
                </Button>
              ) : null}
              {profiles.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hover:cursor-pointer">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowCreateProfileDialog(true)} className="hover:cursor-pointer">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Profile
                    </DropdownMenuItem>
                    {isUnlocked && (
                      <DropdownMenuItem onClick={handleChangePassphrase} className="hover:cursor-pointer">
                        <Key className="w-4 h-4 mr-2" />
                        Change Passphrase
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setShowSettingsDialog(true)} className="hover:cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Storage Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleClearAllProfiles}
                      className="text-red-600 dark:text-red-400 hover:cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Profiles
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Connection Progress */}
          {isConnecting && (
            <div className="p-4 border-b bg-primary/5 dark:bg-primary/10">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="text-sm font-medium text-primary">
                    {connectionProgress}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please wait while we establish the connection...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Error */}
          {connectionError && (
            <div className="p-4 border-b bg-destructive/5 dark:bg-destructive/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Connection Failed
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {connectionError}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="text-destructive hover:text-destructive/80"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {profiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No encrypted profiles saved</p>
              <p className="text-sm">Create your first encrypted connection profile</p>
              <Button 
                className="mt-4 hover:cursor-pointer" 
                onClick={() => setShowCreateProfileDialog(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Profile
              </Button>
            </div>
          ) : !isUnlocked ? (
            <div className="text-center py-8 text-muted-foreground">
              <Lock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Profiles are locked</p>
              <p className="text-sm">Enter your passphrase to unlock your connection profiles</p>
              <Button 
                className="mt-4 hover:cursor-pointer" 
                onClick={() => {
                  setPassphraseMode('enter')
                  setPassphraseError(null) // Clear any previous errors
                  setShowPassphraseDialog(true)
                }}
              >
                <Unlock className="w-4 h-4 mr-2" />
                Unlock Profiles
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2 p-3">
                {profiles.map((profile) => {
                  const isActive = activeConnectionId === profile.id || profile.isConnected
                  return (
                    <TooltipProvider key={profile.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`p-3 border rounded-lg transition-all duration-200 hover:bg-muted/50 hover:shadow-sm cursor-pointer ${
                              isActive 
                                ? "border-green-500 bg-green-50/50 dark:bg-green-950/20 dark:border-green-400" 
                                : "border-border"
                            } ${!isUnlocked ? "opacity-60" : ""}`}
                              onClick={() => {
                                if (isUnlocked) {
                                  handleConnectToProfile(profile.id)
                                } else {
                                  // Show unlock prompt
                                  setPassphraseMode('enter')
                                  setPassphraseError(null) // Clear any previous errors
                                  setShowPassphraseDialog(true)
                                }
                              }}
                          >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"
                            }`} />
                            {!isUnlocked ? (
                              <Lock className="w-4 h-4 text-orange-500" />
                            ) : (
                              <Shield className={`w-4 h-4 ${
                                isActive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                              }`} />
                            )}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <h3 className={`font-medium truncate max-w-[250px] ${
                              isActive ? "text-green-700 dark:text-green-300" : ""
                            }`}>
                              {profile.name}
                            </h3>
                            <div className="text-sm text-muted-foreground">
                              <span className="truncate block max-w-[250px]">
                                {isActive ? "Currently connected" : 
                                 !isUnlocked ? "Click to unlock profile" : 
                                 "Click to connect"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isActive && (
                            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                              Active
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {formatLastConnected(profile.lastConnected)}
                          </div>

                          <div className="relative">
                            <Button 
                              variant={isActive ? "default" : "ghost"}
                              size="sm" 
                              className={`h-8 w-8 p-0 ${
                                isActive 
                                  ? "bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-300" 
                                  : !isUnlocked 
                                    ? "bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900 dark:hover:bg-orange-800 dark:text-orange-300"
                                    : "hover:bg-muted"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isUnlocked) {
                                  handleConnectToProfile(profile.id)
                                } else {
                                  setPassphraseMode('enter')
                                  setPassphraseError(null) // Clear any previous errors
                                  setShowPassphraseDialog(true)
                                }
                              }}
                            >
                              {!isUnlocked ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Activity className="w-4 h-4" />
                              )}
                            </Button>
                          </div>

                          {isUnlocked && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 hover:bg-muted"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditProfile(profile.id)
                                  }}
                                  className="hover:cursor-pointer"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteProfile(profile.id, profile.name)
                                  }}
                                  className="text-red-600 dark:text-red-400 hover:cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Profile
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {isActive 
                              ? "Currently connected" 
                              : !isUnlocked 
                                ? "Click to unlock profile" 
                                : "Click to connect to this profile"
                            }
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Passphrase Dialog */}
      <PassphraseDialog
        isOpen={showPassphraseDialog}
        onClose={handlePassphraseClose}
        onConfirm={handlePassphraseConfirm}
        mode={passphraseMode}
        showGenerateOption={passphraseMode === 'create'}
        error={passphraseError}
      />

      {/* Change Passphrase Dialog */}
      <PassphraseDialog
        isOpen={showChangePassphraseDialog}
        onClose={handlePassphraseClose}
        onConfirm={handlePassphraseConfirm}
        mode="change"
        title="Change Passphrase"
        description="Enter your current passphrase, then create a new one to re-encrypt all your connection profiles."
        error={passphraseError}
      />

      {/* Create Profile Wizard */}
      <CreateProfileWizard
        isOpen={showCreateProfileDialog}
        onClose={() => setShowCreateProfileDialog(false)}
        onComplete={handleCreateProfile}
        isUnlocked={isUnlocked}
        mode="create"
      />

      {/* Edit Profile Wizard */}
      <CreateProfileWizard
        isOpen={showEditProfileDialog}
        onClose={() => {
          setShowEditProfileDialog(false)
          setEditingProfile(null)
        }}
        onComplete={handleUpdateProfile}
        isUnlocked={isUnlocked}
        initialConfig={editingProfile}
        initialName={editingProfile?.name}
        mode="edit"
      />

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Storage Settings</DialogTitle>
            <DialogDescription>
              Manage your encrypted connection profiles storage
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profiles Count</span>
              <Badge variant="secondary">{profiles.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Storage Status</span>
              <Badge variant={isUnlocked ? "default" : "secondary"}>
                {isUnlocked ? "Unlocked" : "Locked"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Encryption</span>
              <Badge variant="default">AES-256-GCM</Badge>
            </div>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                All data is encrypted locally using your passphrase. 
                Your passphrase is never stored and is required on every reload.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
