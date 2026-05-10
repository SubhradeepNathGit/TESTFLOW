import { useState, useEffect, useRef } from 'react';

const useThrottle = (value, limit = 500) => {
    const [throttledValue, setThrottledValue] = useState(value);
    const lastRan = useRef(null);

    useEffect(() => {
        if (!lastRan.current) {
            lastRan.current = Date.now();
        }

        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= limit) {
                setThrottledValue(value);
                lastRan.current = Date.now();
            }
        }, Math.max(0, limit - (Date.now() - lastRan.current)));

        return () => clearTimeout(handler);
    }, [value, limit]);

    return throttledValue;
};

export default useThrottle;
