<script lang="ts">
  import SvelteMarkdown from "@humanspeak/svelte-markdown";
  import { onMount } from "svelte";
  import { userService, type User } from "../services/userService";
  
  // Interface matching our background API response
  interface ApiResponse {
    score: number;
    content: string;
    sources: string[];
    // Premium features
    premiumInsights?: {
      factChecks: {source: string, verdict: string}[];
      citations: {text: string, source: string}[];
      contradictions: {statement: string, contradiction: string}[];
    }
  }
  
  let apiData: ApiResponse | null = null;
  let loading = false;
  let error: string | null = null;
  let user: User | null = null;
  let userLoading = true;
  
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
  
  onMount(async () => {
    // Check if we're in a popup context by examining the URL
    isPopup = window.location.pathname.includes("popup.html");
    
    try {
      user = await userService.getCurrentUser();
    } catch (err) {
      console.error("Failed to load user data:", err);
    } finally {
      userLoading = false;
      fetchData();
    }
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
        
        // Add premium insights if they don't exist yet
        if (!apiData.premiumInsights) {
          apiData.premiumInsights = {
            factChecks: [
              {source: "FactCheck.org", verdict: "Partly False"},
              {source: "ScienceDirect", verdict: "Needs Context"},
              {source: "Academic Research Journal", verdict: "Missing Important Context"}
            ],
            citations: [
              {text: "Neural networks excel at pattern recognition", source: "MIT Technology Review"},
              {text: "Deep learning is a subset of machine learning", source: "Stanford AI Lab"}
            ],
            contradictions: [
              {
                statement: "Neural networks are always better than traditional algorithms", 
                contradiction: "For simple problems with small datasets, traditional algorithms often perform better"
              }
            ]
          };
        }
      } else {
        // Request fresh data from background script
        const response = await chrome.runtime.sendMessage({
          action: "getApiData",
        });
  
        if (response.success) {
          apiData = response.data;
          
          // Add mock premium insights
          apiData.premiumInsights = {
            factChecks: [
              {source: "FactCheck.org", verdict: "Partly False"},
              {source: "ScienceDirect", verdict: "Needs Context"},
              {source: "Academic Research Journal", verdict: "Missing Important Context"}
            ],
            citations: [
              {text: "Neural networks excel at pattern recognition", source: "MIT Technology Review"},
              {text: "Deep learning is a subset of machine learning", source: "Stanford AI Lab"}
            ],
            contradictions: [
              {
                statement: "Neural networks are always better than traditional algorithms", 
                contradiction: "For simple problems with small datasets, traditional algorithms often perform better"
              }
            ]
          };
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

  function handleUpgradeClick() {
    // In a real extension this would navigate to an options page or open a new tab
    chrome.runtime.openOptionsPage();
  }
</script>
  
<div class={`font-sans text-gray-800 w-full ${isPopup ? 'w-[400px] max-h-[600px] overflow-y-auto' : ''}`}>
  <h2 class="text-xl font-bold text-slate-700 border-b border-gray-200 pb-2 mb-4">Analysis Result</h2>
  
  {#if loading || userLoading}
    <div class="flex flex-col items-center py-8">
      <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p>Loading analysis...</p>
    </div>
  {:else if error}
    <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
      <p>Error: {error}</p>
      <button 
        class="mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors" 
        on:click={fetchData}
      >
        Retry
      </button>
    </div>
  {:else if apiData && user}
    <div class="w-full">
      <!-- Basic Analysis Result - Available to all users -->
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
      
      <!-- Premium Features Section -->
      <div class="mt-10 border-t border-gray-200 pt-6">
        <div class="flex items-center mb-4">
          <h3 class="text-lg font-medium text-slate-700">Premium Analysis</h3>
          {#if !user.isPremium}
            <span class="ml-2 px-2 py-0.5 bg-gray-100 text-xs text-gray-600 rounded">
              Premium Only
            </span>
          {/if}
        </div>
        
        <!-- Premium content shown based on user status -->
        {#if user.isPremium && apiData.premiumInsights}
          <!-- Fact Checks -->
          <div class="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 class="font-medium mb-3 text-slate-700">Fact Checks</h4>
            <ul class="space-y-2">
              {#each apiData.premiumInsights.factChecks as check}
                <li class="flex items-start">
                  <span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded mr-2 mt-0.5">
                    {check.verdict}
                  </span>
                  <span class="text-sm">{check.source}</span>
                </li>
              {/each}
            </ul>
          </div>
          
          <!-- Citations -->
          <div class="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 class="font-medium mb-3 text-slate-700">Citation Analysis</h4>
            <ul class="space-y-3">
              {#each apiData.premiumInsights.citations as citation}
                <li class="text-sm">
                  <p class="italic">"{citation.text}"</p>
                  <p class="text-xs text-gray-500 mt-1">— {citation.source}</p>
                </li>
              {/each}
            </ul>
          </div>
          
          <!-- Contradictions -->
          <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 class="font-medium mb-3 text-slate-700">Contradictions Found</h4>
            {#each apiData.premiumInsights.contradictions as contradiction}
              <div class="mb-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0">
                <p class="text-sm font-medium">Claim: {contradiction.statement}</p>
                <p class="text-sm text-red-600 mt-1">Contradiction: {contradiction.contradiction}</p>
              </div>
            {/each}
          </div>
        {:else}
          <!-- Premium features locked UI -->
          <div class="relative">
            <!-- Blurred/Skeleton premium content -->
            <div class="filter blur-sm opacity-60 pointer-events-none">
              <!-- Fact Checks Skeleton -->
              <div class="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h4 class="font-medium mb-3 text-slate-700">Fact Checks</h4>
                <div class="space-y-2">
                  <div class="flex items-center">
                    <div class="h-5 w-16 bg-gray-200 rounded mr-2"></div>
                    <div class="h-4 w-40 bg-gray-200 rounded"></div>
                  </div>
                  <div class="flex items-center">
                    <div class="h-5 w-16 bg-gray-200 rounded mr-2"></div>
                    <div class="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
              
              <!-- Citations Skeleton -->
              <div class="mb-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h4 class="font-medium mb-3 text-slate-700">Citation Analysis</h4>
                <div class="space-y-3">
                  <div>
                    <div class="h-4 w-full bg-gray-200 rounded mb-1"></div>
                    <div class="h-4 w-3/4 bg-gray-200 rounded mb-1"></div>
                    <div class="h-3 w-28 bg-gray-200 rounded mt-2"></div>
                  </div>
                  <div>
                    <div class="h-4 w-full bg-gray-200 rounded mb-1"></div>
                    <div class="h-4 w-1/2 bg-gray-200 rounded mb-1"></div>
                    <div class="h-3 w-32 bg-gray-200 rounded mt-2"></div>
                  </div>
                </div>
              </div>
              
              <!-- Contradictions Skeleton -->
              <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h4 class="font-medium mb-3 text-slate-700">Contradictions Found</h4>
                <div class="mb-3 pb-3 border-b border-gray-100">
                  <div class="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div class="h-4 w-3/4 bg-gray-200 rounded"></div>
                </div>
                <div>
                  <div class="h-4 w-full bg-gray-200 rounded mb-2"></div>
                  <div class="h-4 w-5/6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            
            <!-- Premium overlay -->
            <div class="absolute inset-0 flex items-center justify-center flex-col bg-white bg-opacity-70 backdrop-blur-sm rounded-lg">
              <div class="text-center p-4">
                <div class="inline-block mb-3 p-2 bg-indigo-100 text-indigo-600 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h4 class="text-lg font-medium mb-2 text-gray-800">Premium Feature</h4>
                <p class="text-sm text-gray-600 mb-4">Unlock in-depth analysis, fact checks and more with a premium subscription.</p>
                <button 
                  class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
                  on:click={handleUpgradeClick}
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <button 
        class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded mt-8 transition-colors w-full sm:w-auto" 
        on:click={fetchData}
      >
        Refresh Analysis
      </button>
    </div>
  {:else}
    <div class="bg-gray-50 p-8 rounded-md text-center">
      <p class="mb-4">No analysis data available</p>
      <button 
        class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors" 
        on:click={fetchData}
      >
        Get Analysis
      </button>
    </div>
  {/if}
</div>
