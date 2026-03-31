// compress image before upload for faster performance
async function compressImage(file: File): Promise<File> {
  const maxWidth = 1920;
  const outputQuality = 0.8; // 80%

  // Determine best output format (prefer webp when available)
  const supportsWebp = (() => {
    try {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').startsWith('data:image/webp');
    } catch {
      return false;
    }
  })();

  const outputType = supportsWebp ? 'image/webp' : 'image/jpeg';

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Downscale large images for faster upload/render
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: outputType }));
            } else {
              resolve(file);
            }
          },
          outputType,
          outputQuality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

export async function uploadToCloudinary(
  file: File
): Promise<{ url: string; public_id: string }> {
  // compress before upload
  const compressedFile = await compressImage(file);

  const form = new FormData();
  form.append('file', compressedFile);

  try {
    const resp = await fetch('/api/cloudinary-upload', {
      method: 'POST',
      body: form,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(
        'Cloudinary upload failed: ' + (err?.error || resp.statusText)
      );
    }

    const data = await resp.json();
    return { url: data.url, public_id: data.public_id };
  } catch (error) {
    // Fallback to process-image API if Cloudinary fails
    console.warn('Cloudinary upload failed, trying fallback:', error);
    
    const fallbackForm = new FormData();
    fallbackForm.append('image', compressedFile);
    fallbackForm.append('options', JSON.stringify({
      formats: ['webp'],
      sizes: [800],
      quality: 80
    }));

    const resp = await fetch('/api/process-image', {
      method: 'POST',
      body: fallbackForm,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(
        'All upload methods failed: ' + (err?.error || resp.statusText)
      );
    }

    const data = await resp.json();
    return { 
      url: data.processed[0].url, 
      public_id: data.processed[0].key 
    };
  }
}

