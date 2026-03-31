'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, Minus, Plus, Loader2, Circle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { HeroHeader } from '@/components/header'
import Footer from '@/components/footer'
import { useCart, CartItem } from '@/components/cart-context'
import { getProductById, Product, getAllProducts } from '@/lib/products'

const StarRating = ({ rating }: { rating: number }) => {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`size-3 ${
                        star <= Math.floor(rating)
                            ? 'fill-amber-600 text-amber-600'
                            : 'text-gray-300'
                    }`}
                />
            ))}
            <span className="text-xs text-gray-600 ml-1">({rating})</span>
        </div>
    )
}

const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
        'Black': '#1a1a1a',
        'Brown': '#6d4c41',
        'Dark Red': '#8B0000',
        'Blonde': '#F4D03F',
        'Natural Black': '#1a1a1a',
        'Dark Brown': '#3e2723',
        'Chestnut Brown': '#6d4c41',
        'Jet Black': '#000000',
        'Off Black': '#2d2d2d',
        'Charcoal': '#36454f',
        'Platinum Blonde': '#f8f8ff',
        'Icy Blonde': '#e6f3ff',
        'Diamond Blonde': '#fafafa',
        'Honey Blonde': '#e6b800',
        'Auburn Red': '#a52a2a',
        'Burgundy Red': '#800020',
        'Copper Red': '#b87333',
        'Strawberry Red': '#ff6347',
        'Honey Brown': '#8b4513',
        'Caramel Brown': '#cd853f',
        'Chocolate Brown': '#3b2f2f',
        'Medium Brown': '#5c4033',
        'Light Brown': '#bc9a6a',
        'Rich Brown': '#654321',
        'Espresso Brown': '#2f1b14',
        'Ash Blonde': '#e0e0e0',
        'Strawberry Blonde': '#ffc0cb',
        'Pearl Blonde': '#f8f6f0',
        'Classic Auburn': '#8b4513',
        'Copper Auburn': '#b87333',
        'Burgundy Auburn': '#800020',
        'Strawberry Auburn': '#ff6347',
        'Velvet Red': '#8b0000',
        'Wine Red': '#722f37',
        'Cherry Red': '#de3163'
    }
    return colorMap[colorName] || '#cccccc'
}

export default function DynamicProductPage({ params }: { params: Promise<{ productId: string }> }) {
    const { addToCart } = useCart()
    const [product, setProduct] = useState<Product | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState(0)
    const [selectedColor, setSelectedColor] = useState('Black')
    const [selectedSize, setSelectedSize] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set())
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
    const [customColor, setCustomColor] = useState('')
    const [isCustomColorDropdownOpen, setIsCustomColorDropdownOpen] = useState(false)
    const [mainDisplayImage, setMainDisplayImage] = useState<string>('')

    const resolvedParams = React.use(params)

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true)
                setError(null)
                const productId = resolvedParams.productId
                const productData = await getProductById(productId)
                if (!productData) {
                    throw new Error('Product not found')
                }
                setProduct(productData)
                setSelectedImage(0) // Reset to first image when product loads
                setMainDisplayImage(productData.image || productData.images?.[0] || '')
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load product')
            } finally {
                setLoading(false)
            }
        }

        loadProduct()
    }, [resolvedParams.productId])

    useEffect(() => {
        const loadRelatedProducts = async () => {
            try {
                const allProducts = await getAllProducts()
                const filtered = allProducts.filter(p => p.id !== product?.id)
                const shuffled = [...filtered].sort(() => 0.5 - Math.random())
                const random = shuffled.slice(0, 4)
                setRelatedProducts(random)
            } catch (err) {
                console.error('Failed to load related products:', err)
            }
        }

        if (product) {
            if (product.sizes && product.sizes.length > 0) {
                setSelectedSize(product.sizes[0])
            }
            loadRelatedProducts()
        }
    }, [product])

    useEffect(() => {
        const handleStorageChange = async () => {
            try {
                const productId = resolvedParams.productId
                const productData = await getProductById(productId)
                if (productData) {
                    setProduct(productData)
                    setMainDisplayImage(productData.image || productData.images?.[0] || '')
                }
            } catch (err) {
                console.error('Failed to reload product:', err)
            }
        }

        const handleStorageEvent = (e: StorageEvent) => {
            if (e.key === 'productsUpdated') {
                handleStorageChange()
            }
        }

        const handleProductsChanged = () => {
            handleStorageChange()
        }

        window.addEventListener('storage', handleStorageEvent)
        window.addEventListener('productsChanged', handleProductsChanged)
        return () => {
            window.removeEventListener('storage', handleStorageEvent)
            window.removeEventListener('productsChanged', handleProductsChanged)
        }
    }, [resolvedParams.productId])

    const handleAddToCart = () => {
        if (!product) return
        if (!selectedSize) {
            alert('Please select size')
            return
        }
        if (product.colors && product.colors.length > 0 && !selectedColor) {
            alert('Please select color')
            return
        }

        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice || '',
            image: product.images?.[0] || '',
            badge: product.badge,
            color: selectedColor || customColor,
            length: selectedSize
        })
        
        setAddedToCart(prev => new Set([...prev, product.id]))
        
        setTimeout(() => {
            setAddedToCart(prev => {
                const newSet = new Set(prev)
                newSet.delete(product.id)
                return newSet
            })
        }, 1000)
    }

    if (loading) {
        return (
            <>
                <HeroHeader />
                <main className="overflow-hidden">
                    <section className="py-8 mt-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
                        <div className="max-w-7xl mx-auto">
                            <Link href="/shop" className="mb-6 inline-block">
                                <Button className="flex items-center gap-2 bg-transparent border border-gray-400 text-gray-700 hover:bg-gray-50 mb-7">
                                    <ArrowLeft className="w-5 h-5" />
                                    Back to Shopping
                                </Button>
                            </Link>
                            <div className="flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-amber-900" />
                                    <p className="text-gray-600">Loading product...</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </>
        )
    }

    if (error || !product) {
        return (
            <>
                <HeroHeader />
                <main className="overflow-hidden">
                    <section className="py-8 mt-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
                        <div className="max-w-7xl mx-auto">
                            <Link href="/shop" className="mb-6 inline-block">
                                <Button className="flex items-center gap-2 bg-transparent border border-gray-400 text-gray-700 hover:bg-gray-50 mb-7">
                                    <ArrowLeft className="w-5 h-5" />
                                    Back to Shopping
                                </Button>
                            </Link>
                            <div className="flex items-center justify-center min-h-[400px]">
                                <div className="text-center">
                                    <div className="text-red-500 mb-4">Error loading product</div>
                                    <p className="text-gray-600 mb-4">{error}</p>
                                    <Link href="/shop">
                                        <Button className="bg-amber-900 text-white hover:bg-amber-800">
                                            Back to Shop
                                        </Button>
                                    </Link>
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
                <section className="py-6 sm:py-8 lg:py-12 mt-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-6 sm:mb-8">
                            <Link href="/shop">
                                <Button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 shadow-sm transition-all duration-200">
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Back to Shopping</span>
                                    <span className="sm:hidden">Back</span>
                                </Button>
                            </Link>
                        </div>
                        <div className="bg-gray-100 rounded-2xl shadow-xl border border-gray-100 p-0">
                            <div className="lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
                                {/* Image Gallery */}
                                <div className="p-0 lg:p-8">
                                    <div className="space-y-4">
                                        {/* Main Image */}
                                        <div className="w-full h-[32rem] bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative">
                                            {mainDisplayImage ? (
                                                <>
                                                <img
                                                    src={mainDisplayImage}
                                                    alt={product.name}
                                                    className={`w-full h-full object-cover rounded-lg ${
                                                        !product.inStock ? 'brightness-50' : ''
                                                    }`}
                                                    onError={() => setMainDisplayImage('')}
                                                />
                                                {/* Sold Out Badge */}
                                                {!product.inStock && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                        <div className="bg-white px-3 py-1 rounded-full">
                                                            <span className="text-red-500 font-semibold text-sm">SOLD OUT</span>
                                                        </div>
                                                    </div>
                                                )}
                                                </>
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="mx-auto text-gray-400" size={48} />
                                                    <p className="text-gray-500 mt-2">No image available</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Thumbnails Below Main Image */}
                                        <div className="flex gap-2 pb-3 justify-start">
                                            {/* Only show main image thumbnail if it exists */}
                                            {product.image || product.images?.[0] ? (
                                                <div className="relative flex-shrink-0">
                                                    <div 
                                                        className={`w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                                                            mainDisplayImage === (product.image || product.images?.[0] || '')
                                                                ? 'border-2 border-amber-600 border-solid' 
                                                                : 'border-2 border-dashed border-gray-300 hover:border-gray-400'
                                                        }`}
                                                        onClick={() => setMainDisplayImage(product.image || product.images?.[0] || '')}
                                                    >
                                                        <img
                                                            src={product.image || product.images?.[0]}
                                                            alt="Main thumbnail"
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                    </div>
                                                </div>
                                            ) : null}

                                            {/* Only show additional thumbnails if they exist and have images */}
                                            {(product.images || []).slice(1, 4).filter(image => image).map((image, index) => (
                                                <div key={index} className="relative flex-shrink-0">
                                                    <div 
                                                        className={`w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                                                            mainDisplayImage === image
                                                                ? 'border-2 border-amber-600 border-solid' 
                                                                : 'border-2 border-dashed border-gray-300 hover:border-gray-400'
                                                        }`}
                                                        onClick={() => setMainDisplayImage(image)}
                                                    >
                                                        <img
                                                            src={image}
                                                            alt={`Product thumbnail ${index + 2}`}
                                                            className="w-full h-full object-cover rounded-lg"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none'
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Product Details */}
                                <div className="p-6 lg:p-8">
                                    <div className="space-y-4">

                                        {/* Brand */}
                                        {product.category && (
                                            <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                                                {product.category}
                                            </p>
                                        )}

                                        {/* Product Name */}
                                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
                                            {product.name}
                                        </h1>

                                        {/* Price */}
                                        <p className="text-2xl font-semibold text-gray-900">
                                            {product.price}
                                        </p>

                                        {/* Length Selector */}
                                        {product.sizes && product.sizes.length > 0 && (
                                            <div className="pt-2">
                                                <p className="text-sm text-gray-600 mb-3">
                                                    Length {selectedSize && <span className="text-gray-900">{selectedSize}</span>}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {product.sizes.map((size: string) => (
                                                        <button
                                                            key={size}
                                                            onClick={() => setSelectedSize(size)}
                                                            className={`min-w-[40px] h-10 px-3 text-sm font-medium transition-all border ${
                                                                selectedSize === size
                                                                    ? 'bg-black text-white border-black'
                                                                    : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400'
                                                            }`}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Color Selector */}
                                        {product.colors && product.colors.length > 0 && (
                                            <div className="pt-2">
                                                <p className="text-sm text-gray-600 mb-3">
                                                    Color {selectedColor && <span className="text-gray-900">{selectedColor}</span>}
                                                </p>
                                                <div className="flex flex-wrap gap-3">
                                                    {(product.colors || []).map((color: string) => (
                                                        <button
                                                            key={color}
                                                            onClick={() => {
                                                                setSelectedColor(color)
                                                                setCustomColor('')
                                                            }}
                                                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                                selectedColor === color && !customColor
                                                                    ? 'border-black ring-2 ring-gray-200'
                                                                    : 'border-gray-300 hover:border-gray-400'
                                                            }`}
                                                            style={{ backgroundColor: getColorHex(color) }}
                                                            title={color}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Buttons Row - Quantity + Add to cart */}
                                        <div className="pt-4 flex items-center gap-3">
                                            {/* Quantity Selector */}
                                            <div className="flex items-center border border-gray-300 rounded-lg h-11 flex-shrink-0">
                                                <button
                                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                    className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors rounded-l-lg"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                                                <button
                                                    onClick={() => setQuantity(quantity + 1)}
                                                    className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors rounded-r-lg"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Add to cart button */}
                                            <button
                                                onClick={handleAddToCart}
                                                disabled={!product.inStock}
                                                className={`flex-1 h-11 px-6 rounded-lg font-medium text-sm transition-all border cursor-pointer ${
                                                    addedToCart.has(product.id)
                                                        ? 'bg-green-50 border-green-500 text-green-700'
                                                        : product.inStock
                                                        ? 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                                                        : 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                                                }`}
                                            >
                                                {addedToCart.has(product.id) ? '✓ Added' : product.inStock ? 'Add to cart' : 'SOLD OUT'}
                                            </button>
                                        </div>

                                        {/* Buy now button - full width */}
                                        <button
                                            onClick={() => {
                                                if (product.inStock) {
                                                    handleAddToCart()
                                                    window.location.href = '/checkout'
                                                }
                                            }}
                                            disabled={!product.inStock}
                                            className={`w-full h-11 px-6 rounded-lg font-medium text-sm transition-all cursor-pointer ${
                                                product.inStock
                                                    ? 'bg-[#E6E0FA] text-gray-900 hover:bg-[#D9D0F5]'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            Buy now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {relatedProducts.length > 0 && (
                            <div className="mt-16 border-t border-gray-200 pt-12">
                                <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-8">You May Also Like</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {relatedProducts.map(rel => (
                                        <Link key={rel.id} href={`/shop/${rel.id}`} className="group block">
                                            <div className="bg-white rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                                                {/* Product Image */}
                                                <div className="relative aspect-square bg-gray-100 overflow-hidden">
                                                    {rel.image || rel.images?.[0] ? (
                                                        <img
                                                            src={rel.image || rel.images?.[0]}
                                                            alt={rel.name}
                                                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                                                                !rel.inStock ? 'brightness-50' : ''
                                                            }`}
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                                                            <div className="w-12 h-12 bg-gray-200 rounded-lg mb-2"></div>
                                                            <p className="text-gray-400 text-xs">No image</p>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Badge */}
                                                    {rel.badge && (
                                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 font-medium">
                                                            {rel.badge}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="p-3">
                                                    <h4 className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                                                        {rel.name.charAt(0).toUpperCase() + rel.name.slice(1).toLowerCase()}
                                                    </h4>
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {rel.price}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </>
    )
}
