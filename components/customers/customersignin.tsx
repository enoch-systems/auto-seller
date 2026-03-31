"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { verifyCustomerPin } from '@/lib/customer-auth'
import { useAuth } from '@/contexts/auth-context'

export default function SignInPage() {
    const [pin, setPin] = useState(['', '', '', ''])
    const [phone, setPhone] = useState('')
    const [showForgotPinMessage, setShowForgotPinMessage] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSigningIn, setIsSigningIn] = useState(false)
    const [error, setError] = useState('')
    const [rememberPhone, setRememberPhone] = useState(false)
    const router = useRouter()
    const { customerSignIn } = useAuth()
    const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

    // Auto-hide forgot pin message after 8 seconds
    useEffect(() => {
        if (showForgotPinMessage) {
            const timer = setTimeout(() => {
                setShowForgotPinMessage(false)
            }, 8000)
            return () => clearTimeout(timer)
        }
    }, [showForgotPinMessage])

    // Load remembered phone number on mount
    useEffect(() => {
        const rememberedPhone = localStorage.getItem('rememberedPhone')
        if (rememberedPhone) {
            setPhone(rememberedPhone)
            setRememberPhone(true)
        }
    }, [])

    // Check if form is complete
    const formComplete = pin.every(digit => digit !== '') && phone.length === 11

    // Auto-login when form is complete
    useEffect(() => {
        if (formComplete && !error) {
            verifyAndLogin()
        }
    }, [formComplete, phone, pin])

    // Handle login
    const verifyAndLogin = async () => {
        if (!formComplete) return
        
        setIsLoading(true)
        setError('')
        
        try {
            // Verify credentials with Firebase
            const isValid = await verifyCustomerPin(phone, pin.join(''))
            
            if (isValid) {
                // Remember phone number if checkbox is checked
                if (rememberPhone) {
                    localStorage.setItem('rememberedPhone', phone)
                } else {
                    localStorage.removeItem('rememberedPhone')
                }
                
                // Set global auth state
                customerSignIn(phone)
                
                // Switch to signing in state
                setIsLoading(false)
                setIsSigningIn(true)
                
                // Wait 4 seconds then redirect
                setTimeout(() => {
                    router.push('/')
                }, 4000)
            } else {
                setError('Invalid phone number or PIN')
                // Clear PIN on wrong attempt
                setPin(['', '', '', ''])
                // Focus first PIN input
                inputRefs[0].current?.focus()
                setIsLoading(false)
            }
            
        } catch (error) {
            console.error('Login error:', error)
            setError('Login failed. Please try again.')
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Signing in overlay */}
            {isSigningIn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                        <p className="text-lg text-white font-semibold">Signing in...</p>
                    </div>
                </div>
            )}

            <section className={`flex min-h-screen bg-gray-100 px-4 py-16 md:py-32 dark:bg-transparent items-center justify-center ${isSigningIn ? 'blur-sm' : ''}`}>
                <div className="w-full max-w-sm">
                    {/* Back to home link */}
                    <div className="mb-4">
                        <Link
                            href="/"
                            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors group"
                        >
                            <svg
                                className="w-4 h-4 mr-2 transform transition-transform group-hover:-translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to home
                        </Link>
                    </div>
                    
                    <form
                        action=""
                        className="bg-card h-fit w-full rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]">
                <div className="p-8 pb-6">
                    <div className="text-center">
                        <Link
                            href="/"
                            aria-label="go home"
                            className="flex items-center justify-center space-x-2">
                            <LogoIcon />
                            <span className="text-lg font-semibold">QuickShop</span>
                        </Link>
                        <h1 className="mb-5 mt-4 text-xl font-light">Welcome back !</h1>
                    </div>

                    <hr className="my-4 border-dashed" />

                    <div className="space-y-6">
                        <div className="space-y-2">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            )}
                            
                            <Label
                                htmlFor="phone"
                                className="block text-sm">
                                Phone number
                            </Label>
                            <Input
                                type="tel"
                                required
                                name="phone"
                                id="phone"
                                maxLength={11}
                                placeholder="Enter phone number"
                                className="h-12"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                onKeyPress={(e) => {
                                    if (!/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value)
                                    // Clear error when user starts typing
                                    if (error) setError('')
                                }}
                            />
                        </div>

                        <div className="space-y-0.5">
                            <div className="flex items-center justify-between">
                                <Label
                                    htmlFor="pwd"
                                    className="text-sm">
                                    Pin
                                </Label>
                            </div>
                            <div className="flex gap-2 justify-center">
                                {[0, 1, 2, 3].map((index) => (
                                    <Input
                                        key={index}
                                        ref={inputRefs[index]}
                                        type="text"
                                        maxLength={1}
                                        required
                                        className="w-12 h-12 text-center text-lg font-semibold"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={pin[index]}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            if (!/[0-9]/.test(value) && value !== '') {
                                                e.preventDefault()
                                                return
                                            }
                                            
                                            // Clear error when user starts typing
                                            if (error) setError('')
                                            
                                            const newPin = [...pin]
                                            newPin[index] = value
                                            setPin(newPin)
                                            
                                            // Auto-focus next input if current is filled
                                            if (value && index < 3) {
                                                inputRefs[index + 1].current?.focus()
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            // Handle backspace to go to previous field
                                            if (e.key === 'Backspace' && !pin[index] && index > 0) {
                                                inputRefs[index - 1].current?.focus()
                                            }
                                            // Prevent non-numeric keys
                                            if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'Delete') {
                                                e.preventDefault()
                                            }
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center space-x-2 mt-3">
                                <input
                                    type="checkbox"
                                    id="rememberPhone"
                                    checked={rememberPhone}
                                    onChange={(e) => setRememberPhone(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <Label htmlFor="rememberPhone" className="text-sm text-gray-700">
                                    Remember phone number
                                </Label>
                            </div>
                            
                            <div className="flex justify-end mt-8">
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => setShowForgotPinMessage(true)}
                                    className="link intent-info variant-ghost text-sm">
                                    Forgot pin ?
                                </Button>
                            </div>
                            {showForgotPinMessage && (
                                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-blue-900 mb-1">Account Recovery</h4>
                                            <p className="text-sm text-blue-800 leading-relaxed">
                                                Contact our support team at{' '}
                                                <a 
                                                    href="mailto:chuzzyenoch@gmail.com?subject=PIN Reset Request&body=I need help resetting my PIN for my account."
                                                    className="font-medium text-blue-700 hover:text-blue-800 underline transition-colors"
                                                >
                                                    chuzzyenoch@gmail.com
                                                </a>
                                                {' '}to reset your PIN after identity verification.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-200">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full h-10 text-sm font-medium text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all"
                                            onClick={() => window.location.href = 'mailto:chuzzyenoch@gmail.com?subject=PIN Reset Request&body=I need help resetting my PIN for my account.'}
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Contact Support
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-center items-center mb-4">
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-2"></div>
                                    <p className="text-sm text-gray-600">Verifying...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-muted rounded-(--radius) border p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Don't have an account ?
                        <Button
                            asChild
                            variant="link"
                            className="px-2">
                            <Link href="/customersignup">Register</Link>
                        </Button>
                    </p>
                </div>
            </form>
                </div>
        </section>
        </>
    )
}
