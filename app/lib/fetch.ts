import {useState, useEffect, useCallback} from "react";

export const fetchAPI = async (url: string, options?: RequestInit) => {
    try {
        // Log the request details for debugging
        console.log(`🔍 Making API request to: ${url}`, options?.method || 'GET');
        
        // Construct full URL for better debugging
        const fullUrl = url.startsWith('http') ? url : `${url}`;
        console.log(`📡 Full URL: ${fullUrl}`);
        
        // Default headers for API requests
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        
        const requestOptions: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options?.headers,
            },
        };
        
        console.log(`📋 Request options:`, JSON.stringify(requestOptions, null, 2));
        
        const response = await fetch(fullUrl, requestOptions);
        
        console.log(`📡 Response status: ${response.status} for ${url}`);
        console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            // Try to get error message from response
            let errorText = '';
            try {
                errorText = await response.text();
            } catch (textError) {
                errorText = `Failed to read error response: ${textError}`;
            }
            
            console.error(`❌ HTTP error! URL: ${url}, Method: ${options?.method || 'GET'}, Status: ${response.status}, Body: ${errorText}`);
            
            // Provide more specific error messages based on status code
            let errorMessage = `HTTP ${response.status}`;
            switch (response.status) {
                case 404:
                    errorMessage += ': API endpoint not found. Check if the route exists.';
                    break;
                case 405:
                    errorMessage += ': Method not allowed. Check if the API supports this HTTP method.';
                    break;
                case 500:
                    errorMessage += ': Internal server error. Check server logs.';
                    break;
                default:
                    errorMessage += `: ${errorText}`;
            }
            
            throw new Error(errorMessage);
        }
        
        // Try to parse as JSON
        let responseData;
        try {
            const responseText = await response.text();
            console.log(`📄 Raw response:`, responseText);
            
            if (responseText.trim() === '') {
                console.log('📄 Empty response received');
                return { success: true, data: null };
            }
            
            responseData = JSON.parse(responseText);
            console.log(`✅ Parsed JSON response:`, responseData);
        } catch (parseError) {
            console.error('❌ Failed to parse JSON response:', parseError);
            throw new Error(`Invalid JSON response from API: ${parseError}`);
        }
        
        return responseData;
    } catch (error) {
        console.error("❌ Fetch error:", error);
        // Re-throw with more context
        if (error instanceof Error) {
            throw new Error(`API request failed for ${url}: ${error.message}`);
        }
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