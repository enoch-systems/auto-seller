'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { HeroHeader } from './header'
import { useCart } from './cart-context'
import { useUI } from '@/contexts/ui-context'
import { Product, getAllProducts } from '@/lib/products'

const StarRating = ({ rating = 0 }: { rating?: number }) => {
    return (
        <div className="flex items-center gap-1">
            <Star className="size-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-600">{rating}</span>
        </div>
    )
}

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
                delay: 0.6,
            },
        },
    },
}

const Shop = () => {
    const { addToCart } = useCart()
    const { profileDropdownOpen, mobileMenuOpen } = useUI()
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedSort, setSelectedSort] = useState('Default')
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [currentPage, setCurrentPage] = useState(1)
    const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set())
    const [searchQuery, setSearchQuery] = useState('')

    // reference and positioning for the dropdown so we can render it
    // fixed on the page and above all other elements
    const searchWrapperRef = useRef<HTMLDivElement>(null)
    const [resultsStyle, setResultsStyle] = useState<{top: number; left: number; width: number} | null>(null)

    // Load products on component mount
    useEffect(() => {
        const loadProducts = async () => {
            try {
                setLoading(true)
                setError(null)
                const productData = await getAllProducts()
                setProducts(productData)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load products')
            } finally {
                setLoading(false)
            }
        }

        loadProducts()
    }, [])

    // Listen for product updates from admin page
    useEffect(() => {
        const handleStorageChange = async () => {
            try {
                const productData = await getAllProducts()
                setProducts(productData)
            } catch (err) {
                console.error('Failed to reload products:', err)
            }
        }

        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('productsChanged', handleStorageChange)
        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('productsChanged', handleStorageChange)
        }
    }, [])

    // update stored settings on mount
    useEffect(() => {
        const savedSort = localStorage.getItem('selectedSort')
        if (savedSort) setSelectedSort(savedSort)
        const savedCat = localStorage.getItem('selectedCategory')
        if (savedCat) setSelectedCategory(savedCat)
    }, [])
    
    useEffect(() => {
        localStorage.setItem('selectedSort', selectedSort)
    }, [selectedSort])
    
    useEffect(() => {
        localStorage.setItem('selectedCategory', selectedCategory)
    }, [selectedCategory])

    // Reset to page 1 when sort changes
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedSort])

    // compute dropdown position whenever query changes or resize occurs
    useEffect(() => {
        if (!searchWrapperRef.current) return
        const rect = searchWrapperRef.current.getBoundingClientRect()
        setResultsStyle({
            top: rect.bottom + window.scrollY,
            left: rect.left + rect.width / 2 + window.scrollX,
            width: rect.width,
        })
    }, [searchQuery])

    // reposition on window resize as well
    useEffect(() => {
        const handler = () => {
            if (!searchWrapperRef.current) return
            const rect = searchWrapperRef.current.getBoundingClientRect()
            setResultsStyle({
                top: rect.bottom + window.scrollY,
                left: rect.left + rect.width / 2 + window.scrollX,
                width: rect.width,
            })
        }
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    const [productsPerPage, setProductsPerPage] = useState(12)
    const [isMobile, setIsMobile] = useState(false)
    const productsPerPageRef = useRef(productsPerPage)

    // Update products per page based on screen size
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768
            const newProductsPerPage = mobile ? 10 : 12
            
            if (newProductsPerPage !== productsPerPageRef.current) {
                productsPerPageRef.current = newProductsPerPage
                setProductsPerPage(newProductsPerPage)
                setCurrentPage(1) // Reset to first page when products per page changes
            }
            setIsMobile(mobile)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])
    const sortOptions = ['Default', 'Price: Low to High', 'Price: High to Low']
    const categories = ['All', 'Lace', 'Human Hair', 'Curly', 'Straight', 'Colored']

    // Calculate pagination
    const indexOfLastProduct = currentPage * productsPerPage
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage
    
    // Sort products to keep badged items at the top
    const sortProductsByBadge = (products: Product[]) => {
        const withBadge = products.filter(p => p.badge)
        const withoutBadge = products.filter(p => !p.badge)
        return [...withBadge, ...withoutBadge]
    }
    
    // Apply price sorting
    const applySorting = (productsToSort: Product[]) => {
        if (selectedSort === 'Price: Low to High') {
            return [...productsToSort].sort((a, b) => {
                const priceA = parseFloat(a.price?.toString().replace(/[^0-9.]/g, '') || '0')
                const priceB = parseFloat(b.price?.toString().replace(/[^0-9.]/g, '') || '0')
                return priceA - priceB
            })
        } else if (selectedSort === 'Price: High to Low') {
            return [...productsToSort].sort((a, b) => {
                const priceA = parseFloat(a.price?.toString().replace(/[^0-9.]/g, '') || '0')
                const priceB = parseFloat(b.price?.toString().replace(/[^0-9.]/g, '') || '0')
                return priceB - priceA
            })
        }
        // Default: return as is (badges already sorted to top)
        return productsToSort
    }
    
    const sortedProducts = sortProductsByBadge(products)
    const filteredProducts = applySorting(
        sortedProducts.filter(product => 
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    )
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct)
    const displayedProducts = currentProducts
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }
    
    const handleAddToCart = (product: Product) => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || '',
            image: product.image || '/placeholder.png',
            badge: product.badge
        })
        
        // Show success feedback
        setAddedToCart(prev => new Set([...prev, product.id]))
        
        // Remove feedback after 1 second
        setTimeout(() => {
            setAddedToCart(prev => {
                const newSet = new Set(prev)
                newSet.delete(product.id)
                return newSet
            })
        }, 1000)
    }

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
    }

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages: number[] = []
        const maxVisiblePages = 4
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            if (currentPage <= 2) {
                for (let i = 1; i <= maxVisiblePages; i++) {
                    pages.push(i)
                }
            } else if (currentPage >= totalPages - 1) {
                for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
                    pages.push(i)
                }
            } else {
                for (let i = currentPage - 1; i <= currentPage + 2; i++) {
                    pages.push(i)
                }
            }
        }
        return pages
    }

    if (loading) {
        return (
            <>
                <HeroHeader />
                <main className="overflow-hidden">
                    <section className="py-8 mt-16 px-4 sm:px-6 lg:px-8 bg-white">
                        <div className="max-w-7xl mx-auto">
                            {/* Header */}
                            <AnimatedGroup variants={transitionVariants}>
                                <div className="text-left mb-8">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-700 mb-2">
                                        Shop 
                                    </h2>
                                </div>
                            </AnimatedGroup>

                            <div className="flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading products...</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </>
        )
    }

    if (error) {
        return (
            <>
                <HeroHeader />
                <main className="overflow-hidden">
                    <section className="py-8 mt-16 px-4 sm:px-6 lg:px-8 bg-white">
                        <div className="max-w-7xl mx-auto">
                            {/* Header */}
                            <AnimatedGroup variants={transitionVariants}>
                                <div className="text-left mb-8">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-700 mb-2">
                                        Shop 
                                    </h2>
                                </div>
                            </AnimatedGroup>

                            <div className="flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                    <div className="text-red-500 mb-4">Error loading products</div>
                                    <p className="text-gray-600 mb-4">{error}</p>
                                    <Button 
                                        onClick={() => window.location.reload()}
                                        className="bg-amber-900 text-white hover:bg-amber-800"
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </>
        )
    }

    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden">
                <section className="py-8 mt-16 px-4 sm:px-6 lg:px-8 bg-white">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <AnimatedGroup variants={transitionVariants}>
                            <div className="text-left mb-8">
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-700 mb-2">
                                    Shop 
                                </h2>
                            </div>
                        </AnimatedGroup>

                        {/* Search Bar */}
                        <AnimatedGroup variants={transitionVariants} className="relative z-1">
                            <div ref={searchWrapperRef} className="relative text-center mb-6">
                                {!profileDropdownOpen && !mobileMenuOpen && (
                                    <div className="hover:bg-background bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-2 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300">
                                        <input
                                            type="text"
                                            placeholder="Search products...."
                                            className="text-foreground text-sm bg-transparent outline-none w-64 placeholder:text-muted-foreground"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            style={{ fontSize: '16px' }}
                                        />
                                        <span className="block h-4 w-0.5 border-l bg-white"></span>
                                        <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500 flex items-center justify-center">
                                            <Search className="m-auto size-3" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AnimatedGroup>
                        
                        {/* Filters */}
                        <AnimatedGroup variants={transitionVariants}>
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
                                {/* Sort Options */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 whitespace-nowrap">By Price:</span>
                                    <select
                                        value={selectedSort}
                                        onChange={(e) => setSelectedSort(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-900 focus:border-transparent text-gray-500 cursor-pointer"
                                    >
                                        {sortOptions.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </AnimatedGroup>

                        
                        {/* Products Grid */}
                        {displayedProducts.length === 0 ? (
                            <AnimatedGroup variants={transitionVariants}>
                                <div className="flex flex-col items-center justify-center min-h-[400px] py-16 px-4">
                                    <div className="text-center">
                                        <div className="mb-6">
                                            <svg className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">No Products Available</h3>
                                        <p className="text-gray-500 text-sm sm:text-base mb-4 max-w-sm mx-auto">
                                            We're currently updating our collection. Check back soon for amazing new products!
                                        </p>
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                                            >
                                                Clear Search
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </AnimatedGroup>
                        ) : (
                        <AnimatedGroup variants={transitionVariants}>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {displayedProducts.map((product) => (
                                    <Link 
                                        key={product.id} 
                                        href={`/shop/${product.id}`}
                                        className="group block"
                                    >
                                        <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200 border border-gray-100">
                                            {/* Product Image */}
                                            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                                <Image
                                                    src={product.image || '/placeholder.png'}
                                                    alt={product.name}
                                                    width={300}
                                                    height={300}
                                                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                                                        !product.inStock ? 'brightness-50' : ''
                                                    }`}
                                                    priority
                                                />
                                                
                                                {/* Badge */}
                                                {product.badge && (
                                                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                                                        {product.badge}
                                                    </span>
                                                )}
                                                
                                                {/* Sold Out Badge */}
                                                {!product.inStock && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <div className="bg-white px-3 py-1 rounded-full">
                                                            <span className="text-red-500 font-semibold text-sm">SOLD OUT</span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Buy Now Button */}
                                                <button 
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        window.location.href = `/shop/${product.id}`
                                                    }}
                                                    className="absolute bottom-2 left-2 bg-black text-white py-1.5 px-3 rounded-md text-xs font-medium hover:bg-gray-800 transition-colors z-20 cursor-pointer"
                                                >
                                                    Buy now
                                                </button>
                                            </div>
                                            
                                            {/* Product Info */}
                                            <div className="p-3">
                                                <h3 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                                                    {product.name.charAt(0).toUpperCase() + product.name.slice(1).toLowerCase()}
                                                </h3>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {product.price}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </AnimatedGroup>
                        )}

                        {/* Pagination */}
                        <AnimatedGroup variants={transitionVariants}>
                            <div className="flex items-center justify-center space-x-2 mt-12 mb-10">
                                <button
                                    onClick={() => {
                                        setCurrentPage(prev => Math.max(prev - 1, 1))
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                    }}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                                >
                                    Prev
                                </button>

                                {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => {
                                    const pageNumber = i + 1;
                                    return (
                                        <button
                                            key={pageNumber}
                                            onClick={() => {
                                                setCurrentPage(pageNumber)
                                                window.scrollTo({ top: 0, behavior: 'smooth' })
                                            }}
                                            className={`px-4 py-2 text-sm rounded-lg transition-colors cursor-pointer ${
                                                currentPage === pageNumber
                                                    ? 'bg-gray-900 text-white border border-gray-900'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {pageNumber}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => {
                                        setCurrentPage(prev => Math.min(prev + 1, totalPages))
                                        window.scrollTo({ top: 0, behavior: 'smooth' })
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                                >
                                    Next
                                </button>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>

            </main>
        </>
    )
}

export default Shop
