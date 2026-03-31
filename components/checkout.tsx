'use client'

import Link from 'next/link'
import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Plus, Minus, Trash2, ExternalLink, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroHeader } from './header'
import { useCart } from './cart-context'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { FlutterWaveButton } from 'flutterwave-react-v3'
import { useAuth } from '@/contexts/auth-context'
import { saveCustomerInfo as saveCustomerInfoToDb, getCustomerInfo } from '@/lib/customer-auth'

interface CustomerInfo {
  name: string
  phone: string
  address: string
  city: string
  state: string
}

interface StateData {
  state: string
  cities: string[]
}

const Checkout = () => {
  const { user, isCustomer } = useAuth()
  const { cartItems, updateQuantity, removeFromCart, clearCart: clearCartFromContext } = useCart()

  const [showClearModal, setShowClearModal] = useState(false)
  const [showSaveInfoWarningModal, setShowSaveInfoWarningModal] = useState(false)
  const [saveCustomerInfo, setSaveCustomerInfo] = useState(false)
  const [isEditingCustomerInfo, setIsEditingCustomerInfo] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCustomerInfo, setIsLoadingCustomerInfo] = useState(true)
  const [hasSavedData, setHasSavedData] = useState<boolean | null>(null) // null = unknown, true = has data, false = no data
  const [nigeriaStatesAndCities, setNigeriaStatesAndCities] = useState<StateData[]>([])
  const [availableCities, setAvailableCities] = useState<string[]>([])

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: ''
  })

  // Auto-fill phone for logged-in customers
  useEffect(() => {
    if (isCustomer && user && 'phone' in user) {
      setCustomerInfo(prev => ({ ...prev, phone: user.phone as string }))
    }
  }, [isCustomer, user])

  // Clear customer info when user logs out
  useEffect(() => {
    if (!user || !isCustomer) {
      setCustomerInfo({
        name: '',
        phone: '',
        address: '',
        city: '',
        state: ''
      })
      setHasSavedData(false)
      setSaveCustomerInfo(false)
      setIsEditingCustomerInfo(false)
      setAvailableCities([])
    }
  }, [user, isCustomer])

  // Fetch Nigerian states and cities
  useEffect(() => {
    fetch('/api/nigeria-states')
      .then(res => res.json())
      .then(data => {
        if (data.success) setNigeriaStatesAndCities(data.data)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  // Load customer info from Firebase
  useEffect(() => {
    if (!isCustomer || !user || !('phone' in user)) {
      setHasSavedData(false)
      setIsLoadingCustomerInfo(false)
      return
    }

    getCustomerInfo(user.phone)
      .then(savedInfo => {
        if (savedInfo?.name && savedInfo?.address && savedInfo?.city && savedInfo?.state) {
          setCustomerInfo(prev => ({
            ...prev,
            name: (savedInfo.name || '') as string,
            address: (savedInfo.address || '') as string,
            city: (savedInfo.city || '') as string,
            state: (savedInfo.state || '') as string
          }))
          setSaveCustomerInfo(savedInfo.saveInfo || false)
          setIsEditingCustomerInfo(false)
          setHasSavedData(true)
        } else {
          setHasSavedData(false)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingCustomerInfo(false))
  }, [isCustomer, user])

  const handleStateChange = useCallback((stateName: string) => {
    const stateData = nigeriaStatesAndCities.find(s => s.state === stateName)
    setAvailableCities(stateData?.cities || [])
    setCustomerInfo(prev => ({ ...prev, state: stateName, city: '' }))
  }, [nigeriaStatesAndCities])

  const handleInputChange = useCallback((field: keyof CustomerInfo, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }, [])

  const areAllFieldsFilled = useCallback(() => {
    return Object.values(customerInfo).every(v => v.trim() !== '')
  }, [customerInfo])

  const saveCustomerInfoToFirebase = useCallback(async () => {
    if (!isCustomer || !user || !('phone' in user)) return
    try {
      await saveCustomerInfoToDb(user.phone, {
        name: customerInfo.name,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state
      }, saveCustomerInfo)
    } catch (error) {
      console.error('Error saving customer info:', error)
    }
  }, [isCustomer, user, customerInfo, saveCustomerInfo])

  const handleSaveInfoToggle = useCallback((checked: boolean) => {
    setSaveCustomerInfo(checked)
    if (checked) {
      setIsEditingCustomerInfo(false)
      setHasSavedData(true)
      if (areAllFieldsFilled()) saveCustomerInfoToFirebase()
    }
  }, [areAllFieldsFilled, saveCustomerInfoToFirebase])

  const handleSaveInfoToggleWithValidation = useCallback((checked: boolean) => {
    if (checked && !areAllFieldsFilled()) {
      setShowSaveInfoWarningModal(true)
      return
    }
    handleSaveInfoToggle(checked)
  }, [areAllFieldsFilled, handleSaveInfoToggle])

  const subtotal = cartItems.reduce((total, item) => {
    const price = parseFloat(item.price.replace(/[^\d.-]/g, ''))
    return total + price * item.quantity
  }, 0)

  const isFormValid = cartItems.length > 0 && areAllFieldsFilled()

  const fwConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK-68ea18a02314bc06b58f175f47b0665f-X',
    tx_ref: Date.now().toString(),
    amount: subtotal,
    currency: 'NGN',
    payment_options: 'card,banktransfer,ussd,qr',
    customer: {
      email: 'customer@qwickshop.com',
      name: customerInfo.name,
      phone_number: customerInfo.phone
    },
    customizations: {
      title: 'QwickShop Payment',
      description: 'Payment for fashion and lifestyle products',
      logo: 'https://your-logo-url.com/logo.png'
    },
    callback: () => clearCartFromContext(),
    onclose: () => {},
    onClose: () => {}
  }

  const triggerPayment = () => {
    const fwButton = document.querySelector('[data-flutterwave-button]') as HTMLButtonElement
    fwButton?.click()
  }

  const handlePayment = () => {
    if (!isFormValid) return
    const orderData = { cartItems, subtotal, total: subtotal, paymentMethod: 'flutterwave' as const, customerInfo }
    localStorage.setItem('pendingOrder', JSON.stringify(orderData))
    triggerPayment()
  }

  const confirmClearCart = () => {
    clearCartFromContext()
    setShowClearModal(false)
  }

  // Modal component
  const Modal = ({ show, onClose, children, className = '' }: { show: boolean; onClose?: () => void; children: React.ReactNode; className?: string }) => {
    if (!show) return null
    return (
      <>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className={`bg-white rounded-lg p-6 max-w-md w-full ${className}`}>{children}</div>
        </div>
      </>
    )
  }

  return (
    <>
      <HeroHeader />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          <Link href="/shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Continue shopping</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Cart Items */}
            <div>
              {cartItems.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">Your cart is empty</p>
                  <Link href="/shop">
                    <Button className="bg-gray-900 text-white hover:bg-gray-800">Continue Shopping</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex gap-4 pb-6 border-b border-gray-100">
                      <Link href={`/shop/${item.id}`} className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden hover:opacity-90">
                        <OptimizedImage src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover" sizes="80px" />
                      </Link>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <Link href={`/shop/${item.id}`} className="font-medium text-gray-900 hover:text-amber-700">{item.name}</Link>
                          <p className="font-semibold text-gray-900">{item.price}</p>
                        </div>
                        {item.color && <p className="text-sm text-gray-500 mt-1">Color: {item.color}</p>}
                        {item.length && <p className="text-sm text-gray-500">Length: {item.length}</p>}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-300 rounded">
                            <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"><Minus className="w-3 h-3" /></button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-50"><Plus className="w-3 h-3" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Info & Order Summary */}
            <div className="lg:pl-8">
              <div className="bg-gray-50 rounded-lg p-6 mb-6 relative">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Customer Information</h2>

                {isLoadingCustomerInfo || hasSavedData === null ? (
                  <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full" /></div>
                ) : (
                  <>
                    {/* Login Prompt */}
                    {!user && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                        <div className="text-center p-6">
                          <div className="w-16 h-16 bg-[#E6E0FA] rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create account with your mobile number</h3>
                          <p className="text-sm text-gray-600 mb-6">One minute to sign up and pay</p>
                          <button
                            onClick={() => { localStorage.setItem('redirectAfterSignup', '/checkout'); window.location.href = '/customersignup' }}
                            className="bg-[#E6E0FA] hover:bg-[#D9D0F5] text-gray-900 font-medium py-3 px-8 rounded-lg"
                          >
                            Create Account & Continue
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Saved Info View */}
                    {hasSavedData && !isEditingCustomerInfo ? (
                      <div className={`space-y-3 ${!user ? 'opacity-30' : ''}`}>
                        <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
                          {[['Name', customerInfo.name], ['Phone', customerInfo.phone], ['Address', customerInfo.address], ['Location', `${customerInfo.city}, ${customerInfo.state}`]].map(([label, value]) => (
                            <div key={label as string} className="flex justify-between">
                              <span className="text-sm text-gray-600">{label}:</span>
                              <span className="text-sm font-medium text-gray-900">{value}</span>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => { setIsEditingCustomerInfo(true); setHasSavedData(false); setAvailableCities([]); setCustomerInfo(prev => ({ ...prev, state: '', city: '' })); }} className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium ml-auto">
                          <Edit className="w-4 h-4" /> Edit my info
                        </button>
                      </div>
                    ) : (
                      /* Form View */
                      <div className={`space-y-4 ${!user ? 'opacity-30 pointer-events-none' : ''}`}>
                        {[
                          { key: 'name', label: "Receiver's Name", type: 'text', placeholder: "Enter receiver's name" },
                          { key: 'phone', label: "Receiver's Phone Number", type: 'tel', placeholder: "Enter receiver's phone number", maxLength: 11, pattern: '[0-9]' },
                          { key: 'address', label: "Receiver's Address", type: 'text', placeholder: "Enter receiver's address" }
                        ].map(field => (
                          <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label} *</label>
                            <input
                              type={field.type}
                              value={customerInfo[field.key as keyof CustomerInfo]}
                              onChange={e => handleInputChange(field.key as keyof CustomerInfo, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E6E0FA]"
                              placeholder={field.placeholder}
                              maxLength={field.maxLength}
                              onKeyPress={field.pattern ? e => { if (!new RegExp(field.pattern!).test(e.key) && !['Backspace', 'Tab', 'Delete'].includes(e.key)) e.preventDefault() } : undefined}
                            />
                          </div>
                        ))}

                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                            <select
                              value={customerInfo.state}
                              onChange={e => handleStateChange(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E6E0FA]"
                              disabled={isLoading}
                            >
                              <option value="">{isLoading ? 'Loading...' : 'Select state'}</option>
                              {nigeriaStatesAndCities.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                            <select
                              value={customerInfo.city}
                              onChange={e => handleInputChange('city', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E6E0FA] disabled:bg-gray-100"
                              disabled={!customerInfo.state || isLoading}
                            >
                              <option value="">Select city</option>
                              {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => { setIsEditingCustomerInfo(false); setHasSavedData(true); }}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              if (!areAllFieldsFilled()) {
                                setShowSaveInfoWarningModal(true)
                                return
                              }
                              saveCustomerInfoToFirebase()
                              setIsEditingCustomerInfo(false)
                              setHasSavedData(true)
                            }}
                            className="flex-1 px-4 py-2 bg-[#E6E0FA] hover:bg-[#D9D0F5] text-gray-900 rounded-lg text-sm font-medium"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">Estimated total</span>
                    <span className="text-xl font-bold text-gray-900">₦{subtotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={!isFormValid}
                  className="w-full bg-[#E6E0FA] hover:bg-[#D9D0F5] disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-900 font-medium py-3.5 px-6 rounded-lg flex items-center justify-center gap-3 transition-colors"
                >
                  <ExternalLink className="w-5 h-5" /> Proceed to Payment
                </button>

                <p className="text-xs text-gray-500 text-center mt-4">Secured by Flutterwave.</p>
                <div className="flex justify-center gap-2 mt-3">
                  <div className="w-12 h-8 bg-white rounded border border-gray-200 flex items-center justify-center text-xs font-bold text-blue-700 italic">VISA</div>
                  <div className="w-12 h-8 bg-white rounded border border-gray-200 flex items-center justify-center">
                    <div className="flex"><div className="w-3 h-3 bg-red-500 rounded-full" /><div className="w-3 h-3 bg-yellow-500 rounded-full -ml-1" /></div>
                  </div>
                </div>

                <div className="hidden">
                  <FlutterWaveButton {...fwConfig} data-flutterwave-button="true">Pay</FlutterWaveButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Clear Cart Modal */}
      <Modal show={showClearModal} onClose={() => setShowClearModal(false)}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Clear Cart</h3>
        <p className="text-gray-600 mb-6">Do you want to clear all items from your cart?</p>
        <div className="flex gap-3">
          <button onClick={() => setShowClearModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">No</button>
          <button onClick={confirmClearCart} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Yes</button>
        </div>
      </Modal>

      {/* Save Info Warning Modal */}
      <Modal show={showSaveInfoWarningModal} onClose={() => setShowSaveInfoWarningModal(false)} className="p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-amber-200">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Complete Your Information First</h3>
          <p className="text-gray-600 mb-6">Please fill in all your customer information before saving:</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2">
            {['Full name', 'Phone number', 'Delivery address', 'State and city'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                <span className="text-gray-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => setShowSaveInfoWarningModal(false)} className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">I'll Fill It Later</button>
          <button onClick={() => setShowSaveInfoWarningModal(false)} className="flex-1 px-6 py-2 bg-[#E6E0FA] text-gray-900 rounded-lg hover:bg-[#D9D0F5]">Fill It Now</button>
        </div>
      </Modal>
    </>
  )
}

export default Checkout
