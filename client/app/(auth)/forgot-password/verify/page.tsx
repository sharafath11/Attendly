"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthCard } from "@/components/auth-card"
import { Button } from "@/components/button"
import { Alert } from "@/components/alert"
import { PasswordInput } from "@/components/password-input"
import { userAuthMethods } from "@/services/methods/userMethods"
import { showErrorToast, showSuccessToast } from "@/utils/toast"
import { validatePassword } from "@/lib/validation/auth.validation"

export default function ResetPasswordVerifyPage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string>("")
  const [error, setError] = useState("")

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("resetEmail")
    if (!savedEmail) {
      router.push("/forgot-password")
    } else {
      setEmail(savedEmail)
    }
  }, [router])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const chars = value.replace(/\D/g, "").split("").slice(0, 6)
      const newOtp = [...otp]
      chars.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char
      })
      setOtp(newOtp)
      
      const nextEmptyIndex = newOtp.findIndex(val => val === "")
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
      const nextInput = document.getElementById(`otp-${focusIndex}`)
      if (nextInput) nextInput.focus()
      return
    }

    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) return

    const otpString = otp.join("")
    if (otpString.length !== 6) {
      setError("Please enter the complete 6-digit OTP")
      return
    }

    const pwdError = validatePassword(password)
    if (pwdError) {
      setError(pwdError)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)
    setAlertMessage("")
    setError("")

    const res = await userAuthMethods.resetPassword({ 
      email, 
      otp: otpString, 
      newPassword: password 
    })

    setIsLoading(false)

    if (!res || !res.ok) {
      const errorMsg = res?.msg || "Failed to reset password"
      setAlertMessage(errorMsg)
      showErrorToast(errorMsg)
      return
    }

    showSuccessToast(res.msg || "Password reset successfully")
    sessionStorage.removeItem("resetEmail")
    router.push("/login")
  }

  if (!email) return null

  return (
    <AuthCard 
      title="Create new password" 
      description={`Enter the 6-digit code sent to ${email} and your new password`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {alertMessage && <Alert type="error" message={alertMessage} onClose={() => setAlertMessage("")} />}
        {error && <Alert type="error" message={error} onClose={() => setError("")} />}

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Verification Code</label>
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 w-12 rounded-lg border border-input bg-background text-center text-lg font-semibold shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <PasswordInput
            label="New Password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <PasswordInput
            label="Confirm New Password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={otp.join("").length !== 6 || !password || !confirmPassword}
          isLoading={isLoading}
        >
          Reset Password
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/forgot-password" className="font-medium text-foreground hover:underline">
            Back to email entry
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
