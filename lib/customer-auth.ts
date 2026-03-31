import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export interface CustomerData {
  phone: string
  pin: string
  createdAt: string
  name?: string
  address?: string
  city?: string
  state?: string
  updatedAt?: string
  saveInfo?: boolean // Preference for saving customer info
}

export const saveCustomerData = async (phone: string, pin: string): Promise<void> => {
  try {
    const customerRef = doc(db, 'customers', phone)
    const customerData: CustomerData = {
      phone,
      pin,
      createdAt: new Date().toISOString()
    }
    await setDoc(customerRef, customerData)
    console.log('Customer data saved successfully')
  } catch (error) {
    console.error('Error saving customer data:', error)
    throw error
  }
}

export const getCustomerData = async (phone: string): Promise<CustomerData | null> => {
  try {
    const customerRef = doc(db, 'customers', phone)
    const customerSnap = await getDoc(customerRef)
    
    if (customerSnap.exists()) {
      return customerSnap.data() as CustomerData
    } else {
      return null
    }
  } catch (error) {
    console.error('Error getting customer data:', error)
    throw error
  }
}

export const verifyCustomerPin = async (phone: string, pin: string): Promise<boolean> => {
  try {
    const customerData = await getCustomerData(phone)
    if (customerData) {
      return customerData.pin === pin
    }
    return false
  } catch (error) {
    console.error('Error verifying customer PIN:', error)
    throw error
  }
}

export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  try {
    const customerData = await getCustomerData(phone)
    return customerData !== null
  } catch (error) {
    console.error('Error checking phone existence:', error)
    throw error
  }
}

export const saveCustomerInfo = async (phone: string, customerInfo: {
  name: string
  address: string
  city: string
  state: string
}, saveInfo?: boolean): Promise<void> => {
  try {
    const customerRef = doc(db, 'customers', phone)
    const existingData = await getCustomerData(phone)
    
    const updatedData: Partial<CustomerData> = {
      ...customerInfo,
      saveInfo,
      updatedAt: new Date().toISOString()
    }
    
    if (existingData) {
      // Update existing customer
      await setDoc(customerRef, { ...existingData, ...updatedData }, { merge: true })
      console.log('Customer info updated successfully')
    } else {
      // Create new customer record with info
      const newCustomerData: CustomerData = {
        phone,
        pin: '', // Will be set during registration
        createdAt: new Date().toISOString(),
        ...customerInfo,
        saveInfo,
        updatedAt: new Date().toISOString()
      }
      await setDoc(customerRef, newCustomerData)
      console.log('Customer info saved successfully')
    }
  } catch (error) {
    console.error('Error saving customer info:', error)
    throw error
  }
}

export const getCustomerInfo = async (phone: string): Promise<{
  name?: string
  address?: string
  city?: string
  state?: string
  saveInfo?: boolean
} | null> => {
  try {
    const customerData = await getCustomerData(phone)
    if (customerData) {
      return {
        name: customerData.name,
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        saveInfo: customerData.saveInfo
      }
    }
    return null
  } catch (error) {
    console.error('Error getting customer info:', error)
    throw error
  }
}
