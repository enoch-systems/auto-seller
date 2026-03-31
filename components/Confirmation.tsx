'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OptimizedImage } from '@/components/ui/optimized-image'

interface ConfirmationProps {
    orderData: {
        address: string
        phone: string
        state: string
        city: string
        customCity?: string
        cartItems: Array<{
            id: string
            name: string
            price: string
            quantity: number
            image: string
            color?: string
            length?: string
        }>
        subtotal: number
        total: number
        orderNumber: string
        paymentMethod?: 'flutterwave' | null
    }
    onBackToShop: () => void
}

const Confirmation = ({ orderData, onBackToShop }: ConfirmationProps) => {
    const [showCancelModal, setShowCancelModal] = useState(false)

    const getItemTotal = (price: string, quantity: number) => {
        const numericPrice = parseInt(price.replace('₦', '').replace(',', ''))
        return `₦${(numericPrice * quantity).toLocaleString()}`
    }

    const getNumericItemTotal = (price: string, quantity: number) => {
        const numericPrice = parseInt(price.replace('₦', '').replace(',', ''))
        return numericPrice * quantity
    }

    const formatOrderNumber = (orderNumber: string) => {
        const randomDigits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('')
        return `ORD-${orderNumber.slice(0, 3).toUpperCase()}${randomDigits}`
    }

    const handleCancelOrder = () => {
        setShowCancelModal(true)
    }

    const confirmCancelOrder = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        onBackToShop()
    }

    const cancelCancelOrder = () => {
        setShowCancelModal(false)
    }

    const handleConfirmOrder = () => {
        const formattedOrderNumber = formatOrderNumber(orderData.orderNumber)
        const cityDisplay = orderData.customCity || orderData.city
        
        const productsList = orderData.cartItems.map((item, index) => {
            const numericTotal = getNumericItemTotal(item.price, item.quantity)
            let details = `${index + 1}. ${item.name}\n   • Quantity: ${item.quantity}\n   • Price: ${item.price}`
            if (item.color) {
                details += `\n   • Color: ${item.color}`
            }
            if (item.length) {
                details += `\n   • Length: ${item.length}`
            }
            details += `\n   • Total: ₦${numericTotal.toLocaleString()}`
            return details
        }).join('\n\n')
        
        const message = `🛍️ *NEW ORDER CONFIRMATION* 🛍️

📋 *Order Details:*
Order Number: ${formattedOrderNumber}
Date: ${new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
💳 *Payment Method:* PAID via Flutterwave

👤 *Customer Information:*
Phone: ${orderData.phone}

📍 *Delivery Address:*
${orderData.address}
${cityDisplay}, ${orderData.state}

📦 *Products Ordered:*
${productsList}

💰 *Order Summary:*
Total: ₦${orderData.total.toLocaleString()}

---
*Order confirmed via QuickShop*
*Payment completed via Flutterwave*`

        const phoneNumber = "2349162919586"
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank')
        
        setTimeout(() => {
            onBackToShop()
        }, 1000)
    }

    useEffect(() => {
        const handleBeforeUnload = () => {
            onBackToShop()
        }
        const handlePopState = () => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            onBackToShop()
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        window.addEventListener('popstate', handlePopState)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            window.removeEventListener('popstate', handlePopState)
        }
    }, [onBackToShop])

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
                    <Link href="/shop" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
                        <ArrowLeft className="w-4 h-4" />
                        Continue shopping
                    </Link>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {/* Success Message */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-1">Payment Successful!</h1>
                    <p className="text-sm text-gray-500">Order {formatOrderNumber(orderData.orderNumber)}</p>
                    {orderData.paymentMethod === 'flutterwave' && (
                        <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">
                            Paid via Flutterwave
                        </span>
                    )}
                </div>

                {/* Order Summary Card */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Order summary</h2>
                    
                    {/* Products */}
                    <div className="space-y-4 mb-4">
                        {orderData.cartItems.map((item) => (
                            <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                                <Link href={`/shop/${item.id}`} className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                                    <OptimizedImage
                                        src={item.image}
                                        alt={item.name}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                        priority={false}
                                        sizes="64px"
                                    />
                                </Link>
                                <div className="flex-1">
                                    <Link href={`/shop/${item.id}`} className="font-medium text-gray-900 text-sm hover:text-blue-600 transition-colors">
                                        {item.name}
                                    </Link>
                                    {item.color && (
                                        <Link href={`/shop/${item.id}`} className="text-xs text-gray-500 hover:text-blue-600 transition-colors inline-block">
                                            Color: {item.color}
                                        </Link>
                                    )}
                                    {item.length && (
                                        <Link href={`/shop/${item.id}`} className="text-xs text-gray-500 hover:text-blue-600 transition-colors inline-block">
                                            Length: {item.length}
                                        </Link>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                                        <span className="font-semibold text-gray-900 text-sm">
                                            {getItemTotal(item.price, item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900">Total</span>
                            <span className="text-xl font-bold text-gray-900">₦{orderData.total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            
                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Customer information</h2>
                    
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Phone</span>
                            <span className="font-medium text-gray-900">{orderData.phone}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Address</span>
                            <span className="font-medium text-gray-900 text-right">{orderData.address}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Location</span>
                            <span className="font-medium text-gray-900">{orderData.customCity || orderData.city}, {orderData.state}</span>
                        </div>
                    </div>
                </div>

                {/* Note */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        Your payment has been received. Click below to send your order confirmation to WhatsApp for processing and delivery.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button 
                        onClick={handleConfirmOrder}
                        className="w-full bg-[#E6E0FA] hover:bg-[#D9D0F5] text-gray-900 font-medium py-3.5 px-6 rounded-lg transition-colors cursor-pointer"
                    >
                        Confirm Order on WhatsApp
                    </button>
                    <button 
                        onClick={handleCancelOrder}
                        className="w-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-3.5 px-6 rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel Order
                    </button>
                </div>

                {/* Cancel Order Modal */}
                {showCancelModal && (
                    <>
                        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"></div>
                        <div className="fixed inset-0 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Order</h3>
                                <p className="text-gray-600 mb-6">
                                    Your order will be canceled. This cannot be reversed. Are you sure?
                                </p>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={cancelCancelOrder}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={confirmCancelOrder}
                                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        Yes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Confirmation
