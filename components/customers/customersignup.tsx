"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { LogoIcon } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { saveCustomerData, checkPhoneExists } from '@/lib/customer-auth'
import { useAuth } from '@/contexts/auth-context'

export default function LoginPage() {
    const [pin, setPin] = useState(['', '', '', ''])
    const [confirmPin, setConfirmPin] = useState(['', '', '', ''])
    const [phone, setPhone] = useState('')
    const [showConfirmPin, setShowConfirmPin] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const { customerSignIn } = useAuth()
    const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
    const confirmInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

    // Get the redirect URL from query params or localStorage
    const getRedirectUrl = () => {
        // Check if there's a redirect parameter in the URL
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            const redirectFrom = urlParams.get('redirect')
            
            // Check localStorage for saved redirect URL
            const savedRedirect = localStorage.getItem('redirectAfterSignup')
            
            // Prioritize URL parameter, then localStorage, then default to checkout
            return redirectFrom || savedRedirect || '/checkout'
        }
        return '/checkout'
    }

    // Check if we should show confirm PIN
    useEffect(() => {
        const pinComplete = pin.every(digit => digit !== '')
        const phoneComplete = phone.length === 11
        setShowConfirmPin(pinComplete && phoneComplete)
    }, [pin, phone])

    // Check if pins match
    const pinsMatch = pin.join('') === confirmPin.join('') && pin.every(digit => digit !== '')

    // Auto-focus first confirm PIN box when it appears
    useEffect(() => {
        if (showConfirmPin) {
            setTimeout(() => {
                confirmInputRefs[0].current?.focus()
            }, 100)
        }
    }, [showConfirmPin])

    // Handle registration
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!pinsMatch) {
            setError('PINs do not match')
            return
        }
        
        setIsLoading(true)
        setError('')
        
        try {
            // Check if phone already exists
            const phoneExists = await checkPhoneExists(phone)
            if (phoneExists) {
                setError('Phone number already registered')
                return
            }
            
            // Save customer data to Firebase
            await saveCustomerData(phone, pin.join(''))
            
            // Auto-login after successful registration
            customerSignIn(phone)
            
            setSuccess(true)
            setTimeout(() => {
                // Get the redirect URL and clear localStorage
                const redirectUrl = getRedirectUrl()
                localStorage.removeItem('redirectAfterSignup')
                router.push(redirectUrl)
            }, 1500)
            
        } catch (error) {
            console.error('Registration error:', error)
            setError('Registration failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <section className="flex min-h-screen bg-gray-100 px-4 py-16 md:py-32 dark:bg-transparent items-center justify-center">
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
                    onSubmit={handleRegister}
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
                        <h1 className="mb-5 mt-4 text-xl font-light">Register in seconds !</h1>
                    </div>

                    <hr className="my-4 border-dashed" />

                    <div className="space-y-6">
                        <div className="space-y-2">
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
                                onKeyPress={(e) => {
                                    if (!/[0-9]/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <div className="space-y-0.5">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm">{error}</p>
                                </div>
                            )}
                            
                            {success && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-green-700 text-sm">Registration successful! Auto-logging in...</p>
                                </div>
                            )}
                            
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
                                        value={pin[index]}
                                        onChange={(e) => {
                                            const value = e.target.value
                                            if (!/[0-9]/.test(value) && value !== '') {
                                                e.preventDefault()
                                                return
                                            }
                                            
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

                            <div
                                className={`space-y-2 transition-all duration-500 ease-out ${
                                    showConfirmPin
                                        ? 'max-h-24 opacity-100 translate-y-0'
                                        : 'max-h-0 opacity-0 -translate-y-4 overflow-hidden'
                                }`}
                            >
                                <Label className="block text-sm">
                                    Confirm Pin
                                </Label>
                                <div className="flex gap-2 justify-center">
                                    {[0, 1, 2, 3].map((index) => (
                                        <Input
                                            key={index}
                                            ref={confirmInputRefs[index]}
                                            type="text"
                                            maxLength={1}
                                            required
                                            className="w-12 h-12 text-center text-lg font-semibold"
                                            value={confirmPin[index]}
                                            onChange={(e) => {
                                                const value = e.target.value
                                                if (!/[0-9]/.test(value) && value !== '') {
                                                    e.preventDefault()
                                                    return
                                                }

                                                const newPin = [...confirmPin]
                                                newPin[index] = value
                                                setConfirmPin(newPin)

                                                // Auto-focus next input if current is filled
                                                if (value && index < 3) {
                                                    confirmInputRefs[index + 1].current?.focus()
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                // Handle backspace to go to previous field
                                                if (e.key === 'Backspace' && !confirmPin[index] && index > 0) {
                                                    confirmInputRefs[index - 1].current?.focus()
                                                }
                                                // Handle Enter key to submit form on last field
                                                if (e.key === 'Enter' && index === 3 && confirmPin[index] && pinsMatch) {
                                                    const formEvent = new Event('submit', { cancelable: true }) as any
                                                    handleRegister(formEvent)
                                                }
                                                // Prevent non-numeric keys
                                                if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab' && e.key !== 'Delete' && e.key !== 'Enter') {
                                                    e.preventDefault()
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button 
                            type="submit"
                            className={`w-full cursor-pointer transition-colors duration-300 h-12 ${
                                pinsMatch 
                                    ? 'bg-black hover:bg-gray-800 text-white' 
                                    : ''
                            }`}
                            disabled={!pinsMatch || isLoading}
                        >
                            {isLoading ? 'Registering...' : 'Register now'}
                        </Button>
                    </div>
                </div>

                <div className="bg-muted rounded-lg border p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Already have an account ?
                        <Button
                            asChild
                            variant="link"
                            className="px-2">
                            <Link href="/customersignin">Login</Link>
                        </Button>
                    </p>
                </div>
            </form>
            </div>
        </section>
    )
}
