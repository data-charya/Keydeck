"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Shield, 
  Lock, 
  Key, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSecureStorage } from "@/lib/client-crypto"
import { isCryptoSupported } from "@/lib/crypto"

export function SecuritySettings() {
  const [isClearing, setIsClearing] = useState(false)
  const [showEncryptionKey, setShowEncryptionKey] = useState(false)
  const { toast } = useToast()

  const handleClearAllData = async () => {
    setIsClearing(true)
    try {
      const secureStorage = getSecureStorage()
      secureStorage.clear()
      toast({
        title: "Data Cleared",
        description: "All encrypted connection data has been removed from your browser.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  const getEncryptionKey = () => {
    return 'Derived from browser characteristics (not stored)'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Settings
        </CardTitle>
        <CardDescription>
          Manage encryption and data security for your Redis connections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Encryption Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-green-500" />
            <span className="font-medium">Data Encryption</span>
            {isCryptoSupported() ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                AES-GCM Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Fallback Mode
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {isCryptoSupported() ? (
              <>
                All connection data is encrypted using AES-GCM encryption before being stored in your browser's localStorage.
                Your Redis passwords and connection details are never stored in plain text.
              </>
            ) : (
              <>
                Your browser doesn't support the Web Crypto API. Data is stored with basic encoding (less secure).
                Consider using a modern browser for better security.
              </>
            )}
          </p>
        </div>

        {/* Encryption Key */}
        {isCryptoSupported() && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Encryption Key</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="encryption-key">Encryption key derivation method</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="encryption-key"
                  value="Derived from browser characteristics (not stored)"
                  readOnly
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your encryption key is derived from stable browser characteristics (user agent, screen size, etc.) 
                and is never stored in localStorage. This ensures your data is encrypted but the key itself is not visible.
              </p>
            </div>
          </div>
        )}

        {/* Security Information */}
        <Alert>
          <Shield className="w-4 h-4" />
          <AlertDescription>
            <strong>Security Features:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              {isCryptoSupported() ? (
                <>
                  <li>• AES-GCM 256-bit encryption</li>
                  <li>• PBKDF2 key derivation (100,000 iterations)</li>
                  <li>• Random salt and IV for each encryption</li>
                  <li>• No data sent to external servers</li>
                  <li>• Browser-only encryption/decryption</li>
                </>
              ) : (
                <>
                  <li>• Base64 encoding (fallback mode)</li>
                  <li>• No data sent to external servers</li>
                  <li>• Browser-only storage</li>
                  <li>• Limited security (upgrade browser recommended)</li>
                </>
              )}
            </ul>
          </AlertDescription>
        </Alert>

        {/* Data Management */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-500" />
            <span className="font-medium">Data Management</span>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Clear All Encrypted Data
                </DialogTitle>
                <DialogDescription>
                  This will permanently delete all your saved Redis connections and encrypted data from this browser.
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This will remove all your saved connections, and you'll need to reconnect to your Redis servers.
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleClearAllData}
                    disabled={isClearing}
                  >
                    {isClearing ? "Clearing..." : "Clear All Data"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Security Best Practices */}
        <div className="space-y-4">
          <h4 className="font-medium">Security Best Practices</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Use strong Redis passwords and enable AUTH</p>
            <p>• Consider using Redis ACLs for fine-grained access control</p>
            <p>• Regularly clear browser data if using shared computers</p>
            <p>• Use HTTPS when accessing Redis over the network</p>
            <p>• Keep your Redis server updated and properly configured</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
