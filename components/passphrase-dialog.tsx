"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Shield, 
  AlertCircle, 
  CheckCircle,
  Key,
  Info
} from "lucide-react"
import { validatePassphrase, generateSecurePassphrase } from "@/lib/connection-encryption"

interface PassphraseDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (passphrase: string) => void
  title?: string
  description?: string
  mode?: 'create' | 'enter' | 'change'
  showGenerateOption?: boolean
  error?: string | null
}

export function PassphraseDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  mode = 'enter',
  showGenerateOption = false,
  error
}: PassphraseDialogProps) {
  const [passphrase, setPassphrase] = useState("")
  const [confirmPassphrase, setConfirmPassphrase] = useState("")
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [showConfirmPassphrase, setShowConfirmPassphrase] = useState(false)
  const [validation, setValidation] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] })

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassphrase("")
      setConfirmPassphrase("")
      setShowPassphrase(false)
      setShowConfirmPassphrase(false)
      setValidation({ isValid: true, errors: [] })
    }
  }, [isOpen])

  // Validate passphrase in real-time
  useEffect(() => {
    if (passphrase && mode === 'create') {
      setValidation(validatePassphrase(passphrase))
    } else {
      setValidation({ isValid: true, errors: [] })
    }
  }, [passphrase, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passphrase
    if (mode === 'create' || mode === 'change') {
      const validationResult = validatePassphrase(passphrase)
      if (!validationResult.isValid) {
        return // Let the parent handle the error
      }

      // Check if passphrases match
      if (passphrase !== confirmPassphrase) {
        return // Let the parent handle the error
      }
    }

    // Minimum length check for all modes
    if (passphrase.length < 8) {
      return // Let the parent handle the error
    }

    onConfirm(passphrase)
  }

  const handleGeneratePassphrase = () => {
    const generated = generateSecurePassphrase()
    setPassphrase(generated)
    setConfirmPassphrase(generated)
    setValidation(validatePassphrase(generated))
  }

  const getDialogTitle = () => {
    if (title) return title
    
    switch (mode) {
      case 'create':
        return "Create Secure Passphrase"
      case 'change':
        return "Change Passphrase"
      default:
        return "Enter Passphrase"
    }
  }

  const getDialogDescription = () => {
    if (description) return description
    
    switch (mode) {
      case 'create':
        return "Create a strong passphrase to encrypt your connection profiles. This passphrase will be required every time you reload the application."
      case 'change':
        return "Enter a new passphrase to re-encrypt your connection profiles."
      default:
        return "Enter your passphrase to decrypt and access your saved connection profiles."
    }
  }

  const isFormValid = () => {
    if (mode === 'create' || mode === 'change') {
      return validation.isValid && passphrase === confirmPassphrase && passphrase.length >= 8
    }
    return passphrase.length >= 8
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Passphrase Input */}
          <div className="space-y-2">
            <Label htmlFor="passphrase" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Passphrase
            </Label>
            <div className="relative">
              <Input
                id="passphrase"
                type={showPassphrase ? "text" : "password"}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter your passphrase"
                className="pr-10"
                autoComplete="new-password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassphrase(!showPassphrase)}
              >
                {showPassphrase ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Confirm Passphrase (for create/change modes) */}
          {(mode === 'create' || mode === 'change') && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassphrase" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirm Passphrase
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassphrase"
                  type={showConfirmPassphrase ? "text" : "password"}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Confirm your passphrase"
                  className="pr-10"
                  autoComplete="new-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassphrase(!showConfirmPassphrase)}
                >
                  {showConfirmPassphrase ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Passphrase Validation (for create mode) */}
          {mode === 'create' && passphrase && !error && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Key className="w-4 h-4" />
                <span className="font-medium">Passphrase Strength:</span>
                {validation.isValid ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              
              {validation.errors.length > 0 && (
                <div className="space-y-1">
                  {validation.errors.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Generate Passphrase Option */}
          {showGenerateOption && mode === 'create' && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePassphrase}
                className="w-full"
              >
                <Key className="w-4 h-4 mr-2" />
                Generate Secure Passphrase
              </Button>
            </div>
          )}

          {/* Security Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Security Note:</strong> Your passphrase is never stored. All encryption/decryption happens locally in your browser. 
              {mode === 'create' && " You'll need to enter this passphrase every time you reload the application."}
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid()}
              className="min-w-[100px]"
            >
              {mode === 'create' ? "Create & Save" :
               mode === 'change' ? "Change Passphrase" :
               "Unlock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
