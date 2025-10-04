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
import { ConnectionConfig } from "@/components/connection-config"
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
  } = useEncryptedProfiles()
  
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

  const handleCreateProfile = async (config: RedisConfig, name?: string) => {
    try {
      if (!isUnlocked) {
        setPassphraseMode('create')
        setShowPassphraseDialog(true)
        setEditingProfile({ config, name })
        return
      }

      const profileName = name || 'New Connection'
      const profileId = await saveProfile(config, profileName, '')
      setShowCreateProfileDialog(false)
      
      // Connect to the new profile with masking
      await maskConnection(onConnect, config, profileName, profileId)
    } catch (error) {
      toast({
        title: "Failed to save profile",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
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
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Encrypted Connection Profiles
                {isUnlocked && <CheckCircle className="w-4 h-4 text-green-500" />}
              </CardTitle>
              <CardDescription>
                {isUnlocked 
                  ? "Your connection profiles are unlocked and ready to use"
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
            <div className="p-4 border-b bg-blue-50/50 dark:bg-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {connectionProgress}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Please wait while we establish the connection...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Error */}
          {connectionError && (
            <div className="p-4 border-b bg-red-50/50 dark:bg-red-950/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      Connection Failed
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {connectionError}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
                              onClick={() => {
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

      {/* Create Profile Dialog */}
      <Dialog open={showCreateProfileDialog} onOpenChange={setShowCreateProfileDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Encrypted Profile</DialogTitle>
            <DialogDescription>
              Create a new encrypted connection profile. Your credentials will be encrypted locally with AES-256-GCM encryption.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ConnectionConfig 
              onConnect={handleCreateProfile}
            />
          </div>
        </DialogContent>
      </Dialog>

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
