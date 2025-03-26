import { count } from "../storage";

// Background service workers
// https://developer.chrome.com/docs/extensions/mv3/service_workers/

// Define the data type for API responses
interface ApiResponse {
    score: number;
    content: string;
    sources: string[];
}

// Function to simulate API fetch with placeholder data
async function fetchPlaceholderData(): Promise<ApiResponse> {
    // Create placeholder data with the required schema
    const placeholderData: ApiResponse = {
        score: 0.87,
        content: `# Understanding Neural Networks

Neural networks are computational systems inspired by the human brain. They consist of:

- **Input Layer**: Receives raw data
- **Hidden Layers**: Process and transform data
- **Output Layer**: Provides the final result

## Key Concepts

1. **Weights and Biases**: Parameters that are adjusted during training
2. **Activation Functions**: Non-linear functions that help neural networks learn complex patterns
3. **Backpropagation**: The primary algorithm for training neural networks

Neural networks excel at:
- Image recognition
- Natural language processing
- Time series prediction`,
        sources: [
            "https://example.com/neural-networks-explained",
            "https://ai-research.org/deep-learning-basics",
            "https://journal.ai/advances-in-neural-networks-2024"
        ]
    };

    // Simulate API delay (200ms)
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(placeholderData);
        }, 200);
    });
}

// Function that external components can call to get data
async function getApiData(): Promise<ApiResponse> {
    try {
        // In a real implementation, this would be a fetch to your API
        const data = await fetchPlaceholderData();

        // Store the result in local storage for components to access
        chrome.storage.local.set({ apiData: data });

        return data;
    } catch (error) {
        console.error("Error fetching API data:", error);
        throw error;
    }
}

chrome.runtime.onInstalled.addListener(() => {
    count.subscribe(console.log);

    // Fetch placeholder data on install
    getApiData().then(data => {
        console.log("Initial API data loaded:", data);
    });
});

// Handle message requests for data from UI components
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getApiData") {
        // Need to return true to indicate async response
        getApiData()
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }

    // Add more message handlers as needed
    return false;
});

// NOTE: If you want to toggle the side panel from the extension's action button,
// you can use the following code:
// chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
//    .catch((error) => console.error(error));