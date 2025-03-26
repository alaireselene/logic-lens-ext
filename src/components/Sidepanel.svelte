<script lang="ts">
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { onMount } from "svelte";
  
    // Interface matching our background API response
    interface ApiResponse {
      score: number;
      content: string;
      sources: string[];
    }
  
    let apiData: ApiResponse | null = null;
    let loading = false;
    let error: string | null = null;
  
    // Determine if component is being used in a popup context
    let isPopup = false;
  
    // Get credibility state based on score
    function getCredibilityState(score: number) {
      if (score < 0.4) {
        return {
          emoji: "😔",
          text: "False Information",
          bgColor: "bg-red-50",
          borderColor: "border-red-500",
        };
      } else if (score < 0.7) {
        return {
          emoji: "🤔",
          text: "Need to Check More",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-500",
        };
      } else {
        return {
          emoji: "😊",
          text: "True Fact",
          bgColor: "bg-green-50",
          borderColor: "border-green-500",
        };
      }
    }
  
    onMount(() => {
      // Check if we're in a popup context by examining the URL
      isPopup = window.location.pathname.includes("popup.html");
      fetchData();
    });
  
    // Function to request data from the background service worker
    async function fetchData() {
      loading = true;
      error = null;
  
      try {
        // First check if data is already in storage
        const storage = await chrome.storage.local.get("apiData");
  
        if (storage.apiData) {
          apiData = storage.apiData;
        } else {
          // Request fresh data from background script
          const response = await chrome.runtime.sendMessage({
            action: "getApiData",
          });
  
          if (response.success) {
            apiData = response.data;
          } else {
            throw new Error(response.error || "Failed to fetch data");
          }
        }
      } catch (err) {
        console.error("Error fetching API data:", err);
        error = err instanceof Error ? err.message : "Unknown error";
        apiData = null;
      } finally {
        loading = false;
      }
    }
  </script>
  
  <div class={`font-sans text-gray-800 w-full ${isPopup ? 'w-[400px] max-h-[600px] overflow-y-auto' : ''}`}>
    <h2 class="text-xl font-bold text-slate-700 border-b border-gray-200 pb-2 mb-4">Analysis Result</h2>
  
    {#if loading}
      <div class="flex flex-col items-center py-8">
        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading analysis...</p>
      </div>
    {:else if error}
      <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <p>Error: {error}</p>
        <button 
          class="mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors" 
          onclick={fetchData}
        >
          Retry
        </button>
      </div>
    {:else if apiData}
      <div class="w-full">
        <div class="mb-6">
          <h3 class="text-lg font-medium text-slate-700 mb-2">Credibility Assessment</h3>
          {#if apiData.score != undefined}
            {@const credState = getCredibilityState(apiData.score)}
            <div class={`flex items-center p-4 rounded-lg mb-4 ${credState.bgColor} border-l-4 ${credState.borderColor}`}>
              <div class="text-3xl mr-4 leading-none">{credState.emoji}</div>
              <div class="font-bold text-lg">
                {credState.text}
                <span class="text-sm opacity-75 ml-1">({Math.round(apiData.score * 100)}%)</span>
              </div>
            </div>
          {/if}
        </div>
  
        <div class="bg-gray-50 p-4 rounded-md mb-5 w-full">
          <h3 class="text-lg font-medium text-slate-700 mb-3">Summary</h3>
          <div class="w-full break-words">
            <SvelteMarkdown source={apiData.content} />
          </div>
        </div>
  
        {#if apiData.sources && apiData.sources.length > 0}
          <div class="mb-5">
            <h3 class="text-lg font-medium text-slate-700 mb-3">Sources</h3>
            <ul class="list-none p-0">
              {#each apiData.sources as source}
                <li class="mb-2">
                  <a 
                    href={source} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="text-blue-500 hover:text-blue-700 hover:underline break-all"
                  >
                    {source}
                  </a>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
  
        <button 
          class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mt-4 transition-colors" 
          onclick={fetchData}
        >
          Refresh Analysis
        </button>
      </div>
    {:else}
      <div class="bg-gray-50 p-8 rounded-md text-center">
        <p class="mb-4">No analysis data available</p>
        <button 
          class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors" 
          onclick={fetchData}
        >
          Get Analysis
        </button>
      </div>
    {/if}
  </div>
  