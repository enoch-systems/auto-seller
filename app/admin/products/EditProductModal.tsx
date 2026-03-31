'use client';
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Upload, Bot, Plus, Edit, CheckCircle, ArrowLeft } from 'lucide-react';
import { Product } from '@/lib/products';
import { descriptionTemplates } from './descriptionTemplates';
import { uploadToCloudinary } from '@/lib/cloudinary';

const EditProductModal = ({
  product,
  onSave,
  onClose
}: {
  product: Product;
  onSave: (product: Product) => void;
  onClose: () => void;
}) => {
  // initialise state from product
  const [editedProduct, setEditedProduct] = useState<Product>({
    ...product,
    sizes: product.sizes && product.sizes.length > 0 ? product.sizes : ['8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'],
    colors: product.colors && product.colors.length > 0 ? product.colors : ['Black'],
    badge: product.badge || ''
  });
  const [mainImage, setMainImage] = useState<string>(product.image || '');
  const [displayImage, setDisplayImage] = useState<string>(product.image || '');
  const [thumbnailImages, setThumbnailImages] = useState<string[]>([
    ...(product.images || []).slice(0, 4),
    ...Array(4 - (product.images || []).slice(0, 4).length).fill('')
  ].slice(0, 4));

  // configuration arrays
  const sizes = ['8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'];
  const badgeOptions = ['None', 'New Arrival', 'Hot Deals', 'Popular', 'Top Selling'];
  const colors = ['Black', 'Brown', 'Dark Red', 'Blonde'];

  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isAvailableDropdownOpen, setIsAvailableDropdownOpen] = useState(false);
  const [isBadgeDropdownOpen, setIsBadgeDropdownOpen] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [sizeButtonText, setSizeButtonText] = useState("Select All");
  const [colorButtonText, setColorButtonText] = useState("Save Changes");
  const [hasChanges, setHasChanges] = useState(false);
  const [hasGeneratedDescription, setHasGeneratedDescription] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [selectedThumbnailIndex, setSelectedThumbnailIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);
  const [isUploadingMainImage, setIsUploadingMainImage] = useState(false);
  const [uploadingThumbnailIndices, setUploadingThumbnailIndices] = useState<number[]>([]);

  const sizeRef = useRef<HTMLDivElement>(null);
  const availableRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const colorRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Helper function to capitalize each word (title case)
  const capitalizeWords = (str: string): string => {
    return str
      .split(' ')
      .map(word => (word.length > 0 ? word[0].toUpperCase() + word.slice(1) : ''))
      .join(' ');
  };

  // validate and clear broken thumbnails on mount
  useEffect(() => {
    const validateThumbnails = async () => {
      const cleanedThumbs = await Promise.all(
        thumbnailImages.map(async (thumb) => {
          if (!thumb || thumb.trim() === '') return '';
          try {
            const response = await fetch(thumb, { method: 'HEAD' });
            return response.ok ? thumb : '';
          } catch {
            return '';
          }
        })
      );
      setThumbnailImages(cleanedThumbs as string[]);
    };
    validateThumbnails();
  }, []);

  // make sure first thumbnail mirrors main image on mount and when main image changes
  useEffect(() => {
    if (mainImage) {
      const newThumbs = [...thumbnailImages];
      newThumbs[0] = mainImage;
      setThumbnailImages(newThumbs);
      setDisplayImage(mainImage); // Also update display image
      setEditedProduct(prev => ({
        ...prev,
        images: [mainImage, ...(prev.images || []).slice(1)]
      }));
    }
  }, [mainImage]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isColorDropdownOpen &&
        colorRef.current &&
        !colorRef.current.contains(event.target as Node)
      ) {
        setIsColorDropdownOpen(false);
      }
      if (
        isSizeDropdownOpen &&
        sizeRef.current &&
        !sizeRef.current.contains(event.target as Node)
      ) {
        setIsSizeDropdownOpen(false);
      }
      if (
        isAvailableDropdownOpen &&
        availableRef.current &&
        !availableRef.current.contains(event.target as Node)
      ) {
        setIsAvailableDropdownOpen(false);
      }
      if (
        isBadgeDropdownOpen &&
        badgeRef.current &&
        !badgeRef.current.contains(event.target as Node)
      ) {
        setIsBadgeDropdownOpen(false);
      }
    };

    return () => {
      document.body.style.overflow = 'auto';
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColorDropdownOpen, isSizeDropdownOpen, isAvailableDropdownOpen, isBadgeDropdownOpen]);

  useEffect(() => {
    if (editedProduct.sizes?.length === 0) {
      setSizeButtonText("Select All");
    } else {
      setSizeButtonText("Save Changes");
    }
  }, [editedProduct.sizes]);

  useEffect(() => {
    if (editedProduct.colors?.length === 0) {
      setColorButtonText("Select All");
    } else {
      setColorButtonText("Save Changes");
    }
  }, [editedProduct.colors]);

  useEffect(() => {
    const originalProduct = product;
    const isChanged = 
      editedProduct.name !== originalProduct.name ||
      editedProduct.price !== originalProduct.price ||
      editedProduct.inStock !== originalProduct.inStock ||
      editedProduct.badge !== originalProduct.badge ||
      JSON.stringify(editedProduct.sizes) !== JSON.stringify(originalProduct.sizes) ||
      JSON.stringify(editedProduct.colors) !== JSON.stringify(originalProduct.colors) ||
      editedProduct.image !== originalProduct.image ||
      JSON.stringify(editedProduct.images) !== JSON.stringify(originalProduct.images) ||
      editedProduct.description !== originalProduct.description ||
      JSON.stringify(editedProduct.features) !== JSON.stringify(originalProduct.features) ||
      editedProduct.originalPrice !== originalProduct.originalPrice ||
      editedProduct.category !== originalProduct.category;
    
    setHasChanges(isChanged);
  }, [editedProduct, product]);

  // image handlers now upload to Cloudinary instead of using blob URLs
  const handleMainImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview immediately using blob URL
    const blobUrl = URL.createObjectURL(file);
    setMainImage(blobUrl);
    setDisplayImage(blobUrl);

    setIsUploadingMainImage(true);
    try {
      const { url } = await uploadToCloudinary(file);
      setMainImage(url);
      setDisplayImage(url);
      setEditedProduct({ ...editedProduct, image: url });

      const newThumbs = [...thumbnailImages];
      newThumbs[0] = url;
      setThumbnailImages(newThumbs);

      const newImages = [...(editedProduct.images || [])];
      newImages[0] = url;
      setEditedProduct(prev => ({ ...prev, images: newImages }));
    } catch (_error) {
      console.error('Main image upload failed:', _error);
      alert('Failed to upload main image. Please try again.');
      // Cleanup blob URL if upload failed
      URL.revokeObjectURL(blobUrl);
    } finally {
      setIsUploadingMainImage(false);
    }
  };

  const handleThumbnailUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview immediately using blob URL
    const blobUrl = URL.createObjectURL(file);
    const newThumbnails = [...thumbnailImages];
    newThumbnails[index] = blobUrl;
    setThumbnailImages(newThumbnails);

    setUploadingThumbnailIndices(prev => [...prev, index]);
    try {
      const { url } = await uploadToCloudinary(file);
      const finalThumbnails = [...thumbnailImages];
      finalThumbnails[index] = url;
      setThumbnailImages(finalThumbnails);

      const newImages = [...(editedProduct.images || [])];
      newImages[index] = url;
      setEditedProduct(prev => ({ ...prev, images: newImages }));
    } catch (err) {
      console.error('Thumbnail upload failed:', err);
      alert('Failed to upload thumbnail. Please try again.');
    } finally {
      setUploadingThumbnailIndices(prev => prev.filter(i => i !== index));
    }
  };

  const handleSave = async () => {
    if (!editedProduct.name || !editedProduct.price) {
      alert('Please fill in at least the product name and price.');
      return;
    }

    // main image must be provided when editing
    if (!mainImage || mainImage.trim() === '') {
      alert('Main product image is required. Please upload an image before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedProduct);
      setIsSaving(false);
      setIsSavedSuccessfully(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch {
      setIsSaving(false);
      alert('Failed to save changes.');
    }
  };

  return (
    <div className={`fixed inset-0 bg-gray-900 ${
      isSizeDropdownOpen || isAvailableDropdownOpen || isColorDropdownOpen ? 'z-[60]' : 'z-50'
    } overflow-y-auto`} onClick={isSaving ? undefined : onClose}>
      {/* Loading Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mx-auto mb-4"></div>
            <p className="text-white">Updating product...</p>
          </div>
        </div>
      )}
      
      <div
        className="bg-gray-800 min-h-screen w-full"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="px-4 py-4 pt-10 border-b border-gray-700 flex items-center sticky top-0 bg-gray-800 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="p-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <h2 className="text-xl font-semibold text-white">Edit Product</h2>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Upload Section - Left Column on Desktop */}
            <div>
              <div className={isSizeDropdownOpen || isAvailableDropdownOpen ? 'filter blur-sm pointer-events-none' : ''}>
                <label className="block text-gray-300 text-sm font-medium mb-4">
                  Product Images <span className="text-red-500">*</span>
                </label>

                <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-gray-400 text-xs mb-2">Main Image <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="w-full h-64 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors">
                    {isUploadingMainImage ? (
                      <div className="text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-blue-400 text-sm">Uploading...</p>
                      </div>
                    ) : displayImage ? (
                      <img
                        src={displayImage}
                        alt="Main product preview"
                        className="w-full h-full object-cover rounded-lg"
                        onError={() => setDisplayImage('')}
                      />
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto text-gray-400" size={24} />
                      </div>
                    )}
                  </div>
                  {displayImage && !isUploadingMainImage && (
                    <button
                      onClick={() => (document.querySelector('input[type="file"]') as HTMLElement)?.click()}
                      className="absolute top-2 right-2 p-2 bg-gray-800 bg-opacity-80 rounded-lg hover:bg-opacity-100 transition-colors"
                      title="Edit main image"
                    >
                      <Edit className="text-white" size={16} />
                    </button>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageUpload}
                    disabled={isUploadingMainImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                
                {/* Reset Thumbnails Button */}
                <div className="mt-4">
                          
                </div>
              </div>

              <div className="w-20 flex flex-col gap-2">
                <label className="block text-gray-400 text-xs mb-2">
                  Thumbnails (4)
                </label>
                <div className="flex-1 space-y-2">
                  {thumbnailImages.map((thumbnail, index) => {
                    console.log(`Thumbnail ${index}:`, thumbnail, 'Type:', typeof thumbnail, 'Trimmed:', thumbnail?.trim());
                    return (
                    <div key={index} className="relative flex-1">
                      <div 
                        className={`w-full h-16 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                          selectedThumbnailIndex === index 
                            ? 'border-4 border-amber-600 border-solid' 
                            : 'border-2 border-dashed border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => {
                          if (index === 0) {
                            // Thumbnail 1 - show main image in display position
                            setDisplayImage(mainImage);
                            setSelectedThumbnailIndex(0);
                          } else if (thumbnail && thumbnail.trim() !== '' && (thumbnail.startsWith('http') || thumbnail.startsWith('blob:'))) {
                            // Thumbnails 2, 3, 4 - only update display image, don't replace thumbnail 1
                            setDisplayImage(thumbnail);
                            setEditedProduct({ ...editedProduct, image: thumbnail });
                            // Don't update mainImage - keep thumbnail 1 as is
                            setSelectedThumbnailIndex(index);
                          } else {
                            // Empty thumbnails - just set selected index
                            setSelectedThumbnailIndex(index);
                          }
                        }}
                      >
                        {index === 0 ? (
                          // Thumbnail 1 - always show main image (they are always the same)
                          isUploadingMainImage ? (
                            <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : mainImage && mainImage.trim() !== '' && (mainImage.startsWith('http') || mainImage.startsWith('blob:')) ? (
                            <div className="relative">
                              <img
                                src={mainImage}
                                alt="Main thumbnail"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="text-center">
                              <Plus className="mx-auto text-gray-400" size={20} />
                            </div>
                          )
                        ) : (
                          // Thumbnails 2, 3, 4 - show image if exists and is valid, otherwise show upload icon
                          uploadingThumbnailIndices.includes(index) ? (
                            <div className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : thumbnail && thumbnail.trim() !== '' && (thumbnail.startsWith('http') || thumbnail.startsWith('blob:')) ? (
                            <div className="relative">
                              <img
                                src={thumbnail}
                                alt="Product thumbnail"
                                className="w-full h-full object-cover rounded-lg cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Only update display image, don't replace thumbnail 1
                                  setDisplayImage(thumbnail);
                                  setEditedProduct({ ...editedProduct, image: thumbnail });
                                  setSelectedThumbnailIndex(index);
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const newThumbs = [...thumbnailImages];
                                  newThumbs[index] = '';
                                  setThumbnailImages(newThumbs);
                                  // Reset selected thumbnail when image is deleted
                                  setSelectedThumbnailIndex(null);
                                }}
                              />
                            </div>
                          ) : (
                            <div className="text-center">
                              <Upload className="mx-auto text-gray-400" size={20} />
                            </div>
                          )
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleThumbnailUpload(index, event)}
                        disabled={uploadingThumbnailIndices.includes(index)}
                        className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${index === 0 || (index > 0 && thumbnail && thumbnail.trim() !== '' && (thumbnail.startsWith('http') || thumbnail.startsWith('blob:'))) ? 'pointer-events-none' : ''}`}
                      />
                    </div>
                    );
                  })}
                </div>
                <button 
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = async (event) => {
                      const files = (event.target as HTMLInputElement).files;
                      if (!files) return;
                      
                      // Process up to 3 images for thumbnails 2, 3, 4
                      const filesToProcess = Array.from(files).slice(0, 3);
                      const newThumbnails = [...thumbnailImages];
                      const newImages = [...(editedProduct.images || [])];
                      const uploadingIndices: number[] = [];
                      
                      // Start uploading all files and track their indices
                      for (let i = 0; i < filesToProcess.length; i++) {
                        const file = filesToProcess[i];
                        const thumbnailIndex = i + 1; // Start from index 1 (thumbnail 2)
                        
                        // Show preview immediately using blob URL
                        const blobUrl = URL.createObjectURL(file);
                        newThumbnails[thumbnailIndex] = blobUrl;
                        
                        // Add to uploading indices
                        uploadingIndices.push(thumbnailIndex);
                        setUploadingThumbnailIndices(prev => [...prev, thumbnailIndex]);
                        
                        // Upload asynchronously
                        (async () => {
                          try {
                            const { url } = await uploadToCloudinary(file);
                            newImages[thumbnailIndex] = url;
                            newThumbnails[thumbnailIndex] = url;
                          } catch (error) {
                            console.error('Error uploading thumbnail:', error);
                          } finally {
                            // Remove from uploading indices
                            setUploadingThumbnailIndices(prev => prev.filter(idx => idx !== thumbnailIndex));
                            setThumbnailImages([...newThumbnails]);
                            setEditedProduct(prev => ({
                              ...prev,
                              images: [...newImages]
                            }));
                          }
                        })();
                      }
                      
                      // Update thumbnails immediately with blob URLs
                      setThumbnailImages(newThumbnails);
                    };
                    input.click();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs mt-1 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Upload size={14} />
                  Upload Multiple Images
                </button>
              </div>
            </div>
          </div>
            </div>

            {/* Form Fields - Right Column on Desktop */}
            <div className="space-y-4">
              {/* Product fields (name, price, etc.) */}
              <div className={isSizeDropdownOpen ? 'hidden' : isAvailableDropdownOpen ? 'filter blur-sm pointer-events-none' : ''}>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Product Name *
            </label>
            <input
              type="text"
              value={editedProduct.name}
              onChange={(e) =>
                setEditedProduct({ ...editedProduct, name: capitalizeWords(e.target.value) })
              }
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter product name"
            />
          </div>

          <div className={isSizeDropdownOpen || isAvailableDropdownOpen ? "filter blur-sm pointer-events-none" : ""}>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Price (₦) *
            </label>
            <input
              type="text"
              value={editedProduct.price}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^\d]/g, '');
                setEditedProduct({
                  ...editedProduct,
                  price: numericValue ? `₦${parseInt(numericValue).toLocaleString()}` : '₦0'
                });
              }}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter price"
            />
          </div>

          <div className={isSizeDropdownOpen ? "filter blur-sm pointer-events-none" : ""}>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Available
            </label>
            <div className={`relative ${isAvailableDropdownOpen ? 'mb-20' : ''}`} ref={availableRef}>
              <button
                type="button"
                onClick={() => setIsAvailableDropdownOpen(!isAvailableDropdownOpen)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 flex items-center justify-between"
              >
                <span className={editedProduct.inStock ? 'text-green-400' : 'text-red-400'}>
                  {editedProduct.inStock ? 'Yes' : 'No'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isAvailableDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isAvailableDropdownOpen && (
                <div className="absolute top-full mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg p-2 z-50">
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-lg text-sm transition-colors text-left bg-gray-600 hover:bg-gray-500 text-white"
                      onClick={() => {
                        setEditedProduct({ ...editedProduct, inStock: true });
                        setIsAvailableDropdownOpen(false);
                      }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className="w-full px-3 py-2 rounded-lg text-sm transition-colors text-left bg-gray-600 hover:bg-gray-500 text-white"
                      onClick={() => {
                        setEditedProduct({ ...editedProduct, inStock: false });
                        setIsAvailableDropdownOpen(false);
                      }}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div ref={colorRef} className={isSizeDropdownOpen ? 'filter blur-sm pointer-events-none' : isColorDropdownOpen ? 'mb-20' : isAvailableDropdownOpen ? 'filter blur-sm pointer-events-none' : ''}>
            <label className="block text-gray-300 text-sm font-medium mb-2">Color</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 flex items-center justify-between"
              >
                <span className={editedProduct.colors && editedProduct.colors.length > 0 ? 'text-white' : 'text-gray-400'}>
                  {editedProduct.colors && editedProduct.colors.length > 0 ? editedProduct.colors.filter(c => colors.includes(c)).join(', ') : 'Select colors'}
                </span>
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform ${isColorDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isColorDropdownOpen && (
                <div className="absolute top-full mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg p-2 z-50">
                  <div className="grid grid-cols-2 gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        disabled={color === 'Black' && editedProduct.colors?.includes(color)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          editedProduct.colors && editedProduct.colors.includes(color)
                            ? color === 'Black'
                              ? 'border-2 border-amber-600 text-white bg-transparent cursor-not-allowed opacity-75'
                              : 'border-2 border-amber-600 text-white bg-transparent'
                            : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                        onClick={() => {
                          if (color === 'Black') return; // Prevent Black from being deselected
                          const currentColors = editedProduct.colors || [];
                          let newColors;
                          if (currentColors.includes(color)) {
                            newColors = currentColors.filter(c => c !== color);
                          } else {
                            newColors = [...currentColors, color];
                          }
                          setEditedProduct({ ...editedProduct, colors: newColors });
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-transparent border border-amber-700 text-amber-700 hover:bg-amber-700 hover:text-white rounded-lg transition-colors"
                      onClick={() => setEditedProduct({ ...editedProduct, colors: ['Black'] })}
                    >
                      Deselect All
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 ${colorButtonText === "Save Changes" ? "bg-green-700 hover:bg-green-800" : "bg-amber-600 hover:bg-amber-700"} text-white rounded-lg transition-colors`}
                      onClick={() => {
                        if (colorButtonText === "Select All") {
                          setEditedProduct({ ...editedProduct, colors });
                          modalRef.current?.scrollTo({ top: modalRef.current.scrollHeight, behavior: 'auto' });
                        } else {
                          setIsColorDropdownOpen(false);
                        }
                      }}
                    >
                      {colorButtonText}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div ref={sizeRef} className={isSizeDropdownOpen ? 'mb-20' : isAvailableDropdownOpen ? 'filter blur-sm pointer-events-none' : ''}>
            <label className="block text-gray-300 text-sm font-medium mb-2">Lengths</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 flex items-center justify-between"
              >
                {(editedProduct.sizes && editedProduct.sizes.length > 0) ? (
                  <span>{editedProduct.sizes.join(', ')}</span>
                ) : (
                  <span className="text-gray-400">Select Length</span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${isSizeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSizeDropdownOpen && (
                <div className="absolute top-full mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg p-2 z-50">
                  <div className="grid grid-cols-4 gap-2">
                    {sizes.map(size => (
                      <button
                        key={size}
                        type="button"
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          (editedProduct.sizes || []).includes(size)
                            ? 'border-2 border-amber-600 text-white bg-transparent'
                            : 'bg-gray-600 hover:bg-gray-500 text-white'
                        }`}
                        onClick={() => {
                          const currentSizes = editedProduct.sizes || [];
                          let newSizes;
                          if (currentSizes.includes(size)) {
                            newSizes = currentSizes.filter(s => s !== size);
                          } else {
                            newSizes = [...currentSizes, size];
                          }
                          setEditedProduct({ ...editedProduct, sizes: newSizes });
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <button
                      type="button"
                      className="px-4 py-2 bg-transparent border border-amber-700 text-amber-700 hover:bg-amber-700 hover:text-white rounded-lg transition-colors"
                      onClick={() => setEditedProduct({ ...editedProduct, sizes: [] })}
                    >
                      Deselect All
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 ${sizeButtonText === "Save Changes" ? "bg-green-700 hover:bg-green-800" : "bg-amber-600 hover:bg-amber-700"} text-white rounded-lg transition-colors`}
                      onClick={() => {
                        if (sizeButtonText === "Select All") {
                          setEditedProduct({ ...editedProduct, sizes });
                          modalRef.current?.scrollTo({ top: modalRef.current.scrollHeight, behavior: 'auto' });
                        } else {
                          setIsSizeDropdownOpen(false);
                        }
                      }}
                    >
                      {sizeButtonText}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`${isSizeDropdownOpen || isAvailableDropdownOpen ? "filter blur-sm pointer-events-none" : ""} ${isSizeDropdownOpen ? "mb-20" : ""}`}>
            <label className="block text-gray-300 text-sm font-medium mb-2">Badge</label>
            <div className={`relative ${isBadgeDropdownOpen ? 'mb-20' : ''}`} ref={badgeRef}>
              <button
                type="button"
                onClick={() => setIsBadgeDropdownOpen(!isBadgeDropdownOpen)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 flex items-center justify-between"
              >
                <span className={editedProduct.badge && editedProduct.badge !== 'None' ? 'text-white' : 'text-gray-400'}>
                  {editedProduct.badge && editedProduct.badge !== 'None' ? editedProduct.badge : 'None'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isBadgeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isBadgeDropdownOpen && (
                <div className="absolute top-full mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg p-2 z-50">
                  <div className="space-y-1">
                    {badgeOptions.map(badge => (
                      <button
                        key={badge}
                        type="button"
                        className="w-full px-3 py-2 rounded-lg text-sm transition-colors text-left bg-gray-600 hover:bg-gray-500 text-white"
                        onClick={() => {
                          setEditedProduct({ ...editedProduct, badge: badge === 'None' ? '' : badge });
                          setIsBadgeDropdownOpen(false);
                        }}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isSizeDropdownOpen && !isBadgeDropdownOpen && !isAvailableDropdownOpen && (
            <>
              {isSavedSuccessfully && (
                <div className="text-green-500 text-center mb-4 flex items-center justify-center gap-2">
                  <CheckCircle size={20} />
                  Product updated successfully!
                </div>
              )}
            </>
          )}
            </div>
          </div>

          {!isSizeDropdownOpen && !isBadgeDropdownOpen && !isAvailableDropdownOpen && (
            <div className="flex justify-end space-x-3 pt-4 mt-6 border-t border-gray-700">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !mainImage}
                className={`px-4 py-2 ${hasChanges ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;
