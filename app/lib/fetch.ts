import {useState, useEffect, useCallback} from "react";

export const fetchAPI = async (url: string, options?: RequestInit) => {
    try {
        // For Expo Router API routes, use relative URLs directly
        const response = await fetch(url, options);
        if (!response.ok) {
         // Try to get error message from response
            const errorText = await response.text();
            console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('Non-JSON response received:', textResponse);
            throw new Error(`Expected JSON response, got: ${contentType}. Response: ${textResponse}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
};

export const useFetch = <T>(url: string, options?: RequestInit) => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetchAPI(url, options);
            setData(result.data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, [url, options]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {data, loading, error, refetch: fetchData};
};