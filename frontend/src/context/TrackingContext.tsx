import React, { createContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '@/lib/storage';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;

export const TrackingContext = createContext<{ sessionId: string } | null>(null);

export const TrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const sessionId = useRef(uuidv4());
    const startTime = useRef(Date.now());

    // 1. Get or Create Guest UUID for non-logged-in users
    const getGuestUuid = () => {
        let id = localStorage.getItem('guest_uuid');
        if (!id) {
            id = `guest_${uuidv4()}`;
            localStorage.setItem('guest_uuid', id);
        }
        return id;
    };

    useEffect(() => {
        // Capture the current path at the start of the effect
        const currentPath = location.pathname;
        const currentStartTime = Date.now();
        startTime.current = currentStartTime;

        // 2. Logic to run when leaving the page (cleanup function)
        return () => {
            const currentUser = getCurrentUser(); // Get fresh user data
            const duration = Math.round((Date.now() - currentStartTime) / 1000);
            if (duration < 1) return; // Don't log accidental clicks < 1s

            const payload = JSON.stringify({
                userId: currentUser?.id || null,
                guestUuid: getGuestUuid(), // Always include Device ID
                email: currentUser?.email || null,
                pagePath: currentPath,
                duration: duration,
                sessionId: sessionId.current,
                userAgent: navigator.userAgent
            });

            // Use sendBeacon for reliability when tab closes or navigates
            const trackUrl = `${BACKEND_URL}/analytics/track`;
            console.log(`Tracking: ${currentPath} for ${duration}s`);
            navigator.sendBeacon(trackUrl, payload);
        };
    }, [location]);

    return (
        <TrackingContext.Provider value={{ sessionId: sessionId.current }}>
            {children}
        </TrackingContext.Provider>
    );
};
