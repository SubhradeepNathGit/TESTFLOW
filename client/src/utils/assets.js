export const getAssetUrl = (path) => {
    if (!path) return "";
    
    // If it's already an absolute URL, return it
    if (path.startsWith('http')) return path;
    
    // Derive base URL from VITE_API_BASE_URL (removing /api suffix)
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3006';
    
    // Ensure no double slashes
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    
    return `${baseUrl}/${normalizedPath}`;
};
