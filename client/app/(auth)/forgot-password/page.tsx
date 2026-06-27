"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthCard } from "@/components/auth-card"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Alert } from "@/components/alert"
import { userAuthMethods } from "@/services/methods/userMethods"
import { showErrorToast, showSuccessToast } from "@/utils/toast"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [alertMessage, setAlertMessage] = useState<string>("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setAlertMessage("")
    setError("")

    const res = await userAuthMethods.forgotPassword({ email })

    setIsLoading(false)

    if (!res || !res.ok) {
      const errorMsg = res?.msg || "Failed to send reset code"
      setAlertMessage(errorMsg)
      showErrorToast(errorMsg)
      return
    }

    showSuccessToast(res.msg || "Reset code sent to your email")
    sessionStorage.setItem("resetEmail", email)
    router.push("/forgot-password/verify")
  }

  return (
    <AuthCard 
      title="Reset your password" 
      description="Enter your email and we'll send you an OTP to reset your password"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {alertMessage && <Alert type="error" message={alertMessage} onClose={() => setAlertMessage("")} />}

        <Input
          label="Email Address"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError("")
          }}
          placeholder="Enter your email"
          error={error}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!email}
          isLoading={isLoading}
        >
          Send Reset Code
        </Button>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
