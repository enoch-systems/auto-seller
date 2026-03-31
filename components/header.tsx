'use client';
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, ShoppingBag, ShoppingCart, HelpCircle, User, Settings, LogOut, ChevronDown, CreditCard, HousePlus, ScissorsLineDashed, Copy, Store } from 'lucide-react'
import React from 'react'
import { cn } from '@/lib/utils'
import { useCart } from './cart-context'
import { useUI } from '@/contexts/ui-context'
import { useAuth } from '@/contexts/auth-context'
import { Logo, LogoIcon } from '@/components/logo'

type ProfileDropdownItem = {
    name?: string;
    email?: string;
    href?: string;
    icon?: React.ElementType;
    isHeader?: boolean;
    isSignOut?: boolean;
}

export const HeroHeader = () => {
    const { profileDropdownOpen, setProfileDropdownOpen, mobileMenuOpen, setMobileMenuOpen } = useUI()
    const { user, isCustomer, customerSignOut, signOut } = useAuth()
    const [isScrolled, setIsScrolled] = React.useState(false)
    const { cartCount } = useCart()
    const [urlCopied, setUrlCopied] = React.useState(false)
    const [shopUrl, setShopUrl] = React.useState('https://wigga.shop')
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const mobileMenuRef = React.useRef<HTMLDivElement>(null)
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    // Create menu items dynamically based on auth state
    type MenuItem = {
        name: string
        href: string
        icon: React.ElementType
        customIcon?: string
    }

    const mobileMenuItems: MenuItem[] = [
        ...(user ? [{ name: isCustomer ? 'My Account' : 'Manage Store', href: isCustomer ? '#' : '/admin/products', icon: isCustomer ? User : Store, customIcon: '/avatar.jpeg' }] : [])
    ]

    const desktopMenuItems: MenuItem[] = [
    ]

    // Profile dropdown items for customer users
    const customerProfileItems: ProfileDropdownItem[] = [
        {
            name: user && 'phone' in user ? user.phone : '',
            isHeader: true
        },
        {
            name: 'Sign Out',
            icon: LogOut,
            isSignOut: true
        }
    ]

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setProfileDropdownOpen(false)
            }
        }

        if (profileDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [profileDropdownOpen, setProfileDropdownOpen])

    // Close mobile menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && !buttonRef.current?.contains(event.target as Node)) {
                setMobileMenuOpen(false)
            }
        }

        if (mobileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [mobileMenuOpen, setMobileMenuOpen])

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Set shop URL on client side only to prevent hydration mismatch
    React.useEffect(() => {
        setShopUrl(window.location.origin)
    }, [])

    return (
        <header>
            {/* Backdrop overlay */}
            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-white/5 backdrop-blur-lg z-10 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />                                                                                  
            )}
            <nav
                data-state={mobileMenuOpen ? 'active' : ''}
                className="fixed z-20 w-full px-2">
                <div className={cn('mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12 bg-[#fbffdb]/1 rounded-2xl', isScrolled && 'max-w-4xl border backdrop-blur-lg lg:px-5')}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/shop"
                                onClick={() => {
                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                }}
                                aria-label="shop"
                                className={cn("flex items-center space-x-2", mobileMenuOpen && "hidden")}>
                                <LogoIcon className="h-8 w-auto" priority={true} />
                                <span className="text-lg font-light">QuickShop</span>
                            </Link>

                            <Link
                                href="/checkout"
                                aria-label="Shopping Cart"
                                className={cn("relative z-20 -m-2.5 -mr-20 block cursor-pointer p-2.5 lg:hidden", mobileMenuOpen && "hidden")}>
                                <Image src="/shopping-bag.png" alt="Shopping Cart" width={24} height={24} className="size-6 object-contain" />
                                <span className="absolute top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                                    {cartCount}
                                </span>
                            </Link>

                            <button
                                ref={buttonRef}
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                aria-label={mobileMenuOpen === true ? 'Close Menu' : 'Open Menu'}
                                className={cn("relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden", mobileMenuOpen && "hidden")}>
                                <Menu className="data-[state=active]:rotate-180 data-[state=active]:scale-0 data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="data-[state=active]:rotate-0 data-[state=active]:scale-100 data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {desktopMenuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            className={`text-black hover:text-black flex items-center gap-2 duration-150`}>
                                            {(['Home', 'Shop Wigs'].includes(item.name)) ? null : (
                                                item.customIcon ? (
                                                    <div className="relative">
                                                        <Image src={item.customIcon} alt={item.name} width={16} height={16} className="size-4 object-contain" />
                                                        {item.name === 'Shopping Bag' && (
                                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                                                                {cartCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <item.icon className="size-5" />
                                                )
                                            )}
                                            {item.name !== 'Shopping Bag' && <span>{item.name}</span>}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Shopping Cart and My Account Icons for Desktop */}
                        <div className="hidden lg:flex items-center gap-4">
                            <Link
                                href="/checkout"
                                className="relative flex items-center p-2 rounded hover:bg-gray-100"
                            >
                                <Image src="/shopping-bag.png" alt="Shopping Cart" width={20} height={20} className="size-5 object-contain" />
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                                    {cartCount}
                                </span>
                            </Link>

                            {/* Login Button */}
                            {!user && (
                                <Link
                                    href="/customersignin"
                                    className="bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                                >
                                    Log in
                                </Link>
                            )}

                            {/* Account Dropdown for Customer Users */}
                            {user && isCustomer && (
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 transition-colors"
                                        title="Account"
                                    >
                                        <User className="size-5 text-gray-600" />
                                        <span className="text-sm text-black">Account</span>
                                        <ChevronDown className={`size-4 text-gray-600 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {profileDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                            {customerProfileItems.map((item, index) => (
                                                <div key={index}>
                                                    {item.isHeader ? (
                                                        <div className="px-4 py-2 border-b border-gray-100">
                                                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                            <p className="text-xs text-gray-500">Customer</p>
                                                        </div>
                                                    ) : item.isSignOut ? (
                                                <button
                                                    onClick={() => {
                                                        customerSignOut()
                                                        setProfileDropdownOpen(false)
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <item.icon className="size-4 text-red-600" />
                                                    <span>{item.name}</span>
                                                </button>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Manage Store Icon for Admin Users */}
                            {user && !isCustomer && (
                                <Link
                                    href="/admin/products"
                                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-100"
                                    title="Manage Store"
                                >
                                    <Store className="size-6 text-gray-600" />
                                    <span className="text-sm text-black">Manage Store</span>
                                    <ChevronDown className="size-4 text-gray-400" />
                                </Link>
                            )}
                        </div>

                        {/* No auth profile dropdown when Supabase auth is removed */}

                        <div ref={mobileMenuRef} data-state={mobileMenuOpen ? 'active' : ''} className="fixed z-50 right-0 top-0 h-screen w-72 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 data-[state=active]:translate-x-0 lg:hidden" tabIndex={100000}>
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                                    <div className="flex items-center space-x-2">
                                        <LogoIcon className="h-7 w-auto" />
                                        <span className="text-lg font-light text-gray-900">QuickShop</span>
                                    </div>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="size-5 text-gray-600" />
                                    </button>
                                </div>
                                
                                {/* Login Button */}
                                {!user && (
                                <div className="mb-6">
                                    <Link
                                        href="/customersignin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="w-full flex items-center justify-center bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                                    >
                                        Log in
                                    </Link>
                                </div>
                                )}
                                
                                {/* Customer Account Info */}
                                {user && isCustomer && (
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="size-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user && 'phone' in user ? user.phone : ''}</p>
                                            <p className="text-xs text-gray-500">Customer Account</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            customerSignOut()
                                            setMobileMenuOpen(false)
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                    >
                                        <LogOut className="size-4" />
                                        Sign Out
                                    </button>
                                </div>
                                )}
                                
                                {/* Admin Account Info */}
                                {user && !isCustomer && (
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                            <User className="size-6 text-amber-700" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user && 'email' in user ? user.email : ''}</p>
                                            <p className="text-xs text-gray-500">Admin Account</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            signOut()
                                            setMobileMenuOpen(false)
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-amber-50 text-amber-700 py-2 px-4 rounded-lg hover:bg-amber-100 transition-colors font-medium"
                                    >
                                        <LogOut className="size-4" />
                                        Sign Out
                                    </button>
                                </div>
                                )}
                                
                                {/* Shop URL Section */}
                                {user && !isCustomer && (
                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <p className="text-sm text-gray-500 mb-3">Share your shop</p>
                                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                        <span className="text-sm text-gray-700 truncate flex-1">{shopUrl}</span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(shopUrl)
                                                setUrlCopied(true)
                                                setTimeout(() => setUrlCopied(false), 2000)
                                            }}
                                            className="p-2 hover:bg-white rounded-md transition-colors shadow-sm"
                                            title="Copy URL"
                                        >
                                            <Copy className="size-4 text-gray-600" />
                                        </button>
                                    </div>
                                    
                                    {/* Copy Notification */}
                                    {urlCopied && (
                                        <div className="mt-2 text-green-600 text-xs">
                                            URL copied to clipboard!
                                        </div>
                                    )}
                                </div>
                                )}

                                {/* Navigation Links */}
                                <ul className="space-y-1">
                                    <li>
                                        <Link
                                            href="/shop"
                                            onClick={() => { setMobileMenuOpen(false); window.scrollTo(0, 0); }}
                                            className="flex items-center gap-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 p-3 rounded-lg transition-colors"
                                        >
                                            <ShoppingBag className="size-5 text-gray-500" />
                                            <span className="font-medium">Shop</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/checkout"
                                            onClick={() => { setMobileMenuOpen(false); }}
                                            className="flex items-center gap-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 p-3 rounded-lg transition-colors"
                                        >
                                            <ShoppingCart className="size-5 text-gray-500" />
                                            <span className="font-medium">Cart</span>
                                            {cartCount > 0 && (
                                                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                                    {cartCount}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                    {user && !isCustomer && (
                                        <li>
                                            <Link
                                                href="/admin/products"
                                                onClick={() => { setMobileMenuOpen(false); }}
                                                className="flex items-center gap-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 p-3 rounded-lg transition-colors"
                                            >
                                                <Store className="size-5 text-gray-500" />
                                                <span className="font-medium">Manage Store</span>
                                                <ChevronDown className="size-4 text-gray-400 ml-auto" />
                                            </Link>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
