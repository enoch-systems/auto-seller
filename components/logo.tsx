import { cn } from '../lib/utils'
import Image from 'next/image'

export const Logo = ({ className }: { className?: string }) => {
    return (
        <Image
            src="/quick.png"
            alt="Logo"
            width={180}
            height={48}
            className={cn('h-8 w-auto object-contain', className)}
            priority
        />
    )
}

export const LogoIcon = ({ className }: { className?: string }) => {
    return (
        <Image
            src="/quick.png"
            alt="Logo"
            width={40}
            height={40}
            className={cn('h-8 w-auto object-contain', className)}
            priority
        />
    )
}
