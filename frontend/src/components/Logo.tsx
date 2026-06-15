

// components/Logo.tsx - Optimized for text-based logos
import React, { useState, useMemo } from 'react';
import logoImage from '@/assets/HMS Logo.png'; // Your HMS Logo.png
import { Building2, Hotel } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'icon' | 'full' | 'text';
  showText?: boolean;
  textVariant?: 'full' | 'acronym';
  quality?: 'low' | 'medium' | 'high';
}

const Logo = ({ 
  className = "", 
  size = 'md',
  variant = 'icon',
  showText = false,
  textVariant = 'acronym',
  quality = 'high'
}: LogoProps) => {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  
  // Size mapping optimized for text readability
  const sizeMap = {
    xs: { 
      container: 'w-6 h-6', 
      image: 'w-5 h-5',
      text: 'text-xs'
    },
    sm: { 
      container: 'w-8 h-8', 
      image: 'w-7 h-7',
      text: 'text-sm'
    },
    md: { 
      container: 'w-10 h-10', 
      image: 'w-9 h-9',
      text: 'text-base'
    },
    lg: { 
      container: 'w-12 h-12', 
      image: 'w-11 h-11',
      text: 'text-lg'
    },
    xl: { 
      container: 'w-16 h-16', 
      image: 'w-15 h-15',
      text: 'text-xl'
    },
    '2xl': { 
      container: 'w-20 h-20', 
      image: 'w-19 h-19',
      text: 'text-2xl'
    }
  };

  // Container styles
  const containerStyles = {
    icon: "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg",
    full: "flex items-center gap-3",
    text: "flex flex-col items-center justify-center"
  };

  // Quality settings for image rendering
  const qualitySettings = {
    low: 'contrast(1.1) saturate(1)',
    medium: 'contrast(1.2) saturate(1.1) brightness(1.05)',
    high: 'contrast(1.3) saturate(1.2) brightness(1.1)'
  };

  // Text rendering for fallback
  const renderTextLogo = () => (
    <div className={`flex flex-col items-center justify-center ${sizeMap[size].container} bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg p-2`}>
      <span className={`font-bold ${sizeMap[size].text} text-primary-foreground leading-none`}>
        HMS
      </span>
      <span className="text-[8px] text-primary-foreground/90 font-medium mt-0.5">
        HOTEL
      </span>
    </div>
  );

  // Fallback to text if image fails
  if (error) {
    return renderTextLogo();
  }

  return (
    <div className={`${containerStyles[variant]} ${sizeMap[size].container} ${className} relative`}>
      {/* Loading skeleton */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg" />
      )}
      
      {/* High-quality image with text optimization */}
      <img
        src={logoImage}
        alt="Hotel Management Service"
        className={`${sizeMap[size].image} object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        loading="eager"
        style={{ 
          filter: qualitySettings[quality],
          imageRendering: 'crisp-edges',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility'
        }}
      />
      
      {/* Text accompaniment */}
      {showText && variant === 'full' && (
        <div className="flex flex-col">
          <span className="font-bold text-foreground whitespace-nowrap">
            {textVariant === 'acronym' ? 'HMS' : 'Hotel Management'}
          </span>
          <span className="text-xs text-muted-foreground">
            {textVariant === 'acronym' ? 'Hotel Management Service' : 'Management System'}
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;