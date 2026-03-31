export interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  rating?: number;
  reviews?: number;
  image?: string;
  images?: string[];
  description?: string;
  features?: string[];
  colors?: string[];
  sizes?: string[];
  inStock?: boolean;
  badge?: string;
  category?: string;
}

export async function getAllProducts(): Promise<Product[]> {
  // Check if we're on the server side
  const isServer = typeof window === 'undefined';
  
  let baseUrl = '';
  if (isServer) {
    // Server-side: use absolute URL
    baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
  }
  // Client-side: use relative URL (empty string)
  
  const url = `${baseUrl}/api/products`;
  console.log('Fetching products from:', url);
  
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Response not ok:', res.status, res.statusText);
    throw new Error('Failed to fetch products');
  }
  return res.json();
}

// fetch a single product by id using the same API endpoint. the backend
// supports an optional ?id= query parameter which restricts the rows.
export async function getProductById(id: string): Promise<Product | null> {
  if (!id) {
    return null;
  }
  
  // Check if we're on the server side
  const isServer = typeof window === 'undefined';
  
  let baseUrl = '';
  if (isServer) {
    // Server-side: use absolute URL
    baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';
  }
  // Client-side: use relative URL (empty string)
  
  const url = `${baseUrl}/api/products?id=${encodeURIComponent(id)}`;
  console.log('Fetching product from:', url);
  
  const res = await fetch(url);
  if (!res.ok) {
    console.error('Response not ok:', res.status, res.statusText);
    throw new Error('Failed to fetch product');
  }
  const data: Product[] = await res.json();
  return data.length > 0 ? data[0] : null;
}
