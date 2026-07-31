import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className = 'size-8', ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/app-logo-icon.png"
            alt="Sapta Icon"
            className={`object-contain ${className}`}
            {...props}
        />
    );
}
