<script lang="ts">
  import { onMount } from "svelte";
  import { userService, type User } from "../services/userService";

  let user: User | null = null;
  let loading = true;
  let error: string | null = null;
  let saveInProgress = false;
  let saveSuccess = false;

  onMount(async () => {
    try {
      user = await userService.getCurrentUser();
    } catch (err) {
      error = "Failed to load user data";
      console.error(err);
    } finally {
      loading = false;
    }
  });

  async function updatePreference(key: keyof User['preferences'], value: boolean) {
    if (!user) return;
    
    saveInProgress = true;
    saveSuccess = false;
    
    try {
      user = await userService.updatePreferences({ [key]: value });
      saveSuccess = true;
      // Reset success message after 3 seconds
      setTimeout(() => saveSuccess = false, 3000);
    } catch (err) {
      error = "Failed to update preference";
      console.error(err);
    } finally {
      saveInProgress = false;
    }
  }

  async function handleUpgrade() {
    if (!user) return;
    
    saveInProgress = true;
    try {
      user = await userService.upgradeToPremium();
    } catch (err) {
      error = "Failed to upgrade subscription";
      console.error(err);
    } finally {
      saveInProgress = false;
    }
  }

  function formatDate(date: Date | null): string {
    return userService.constructor.formatExpiryDate(date);
  }
</script>

<div class="font-sans text-gray-800 w-full p-4 max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold text-slate-700 mb-6">LogicLens Settings</h1>

  {#if loading}
    <div class="flex flex-col items-center py-8">
      <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p>Loading user information...</p>
    </div>
  {:else if error}
    <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
      <p>Error: {error}</p>
    </div>
  {:else if user}
    <!-- Account Badge & Information -->
    <div class="mb-8">
      <div class="flex items-center mb-4">
        <h2 class="text-xl font-semibold">Account Information</h2>
        {#if user.isPremium}
          <span class="ml-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium px-3 py-1 rounded-full">
            Premium
          </span>
        {:else}
          <span class="ml-3 bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
            Free
          </span>
        {/if}
      </div>

      <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p class="text-sm text-gray-500">Email</p>
            <p class="font-medium">{user.email}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Name</p>
            <p class="font-medium">{user.name}</p>
          </div>
          {#if user.isPremium}
            <div class="sm:col-span-2">
              <p class="text-sm text-gray-500">Premium expires on</p>
              <p class="font-medium">{formatDate(user.premiumExpiry)}</p>
            </div>
          {/if}
        </div>

        {#if !user.isPremium}
          <div class="mt-6 border-t border-gray-100 pt-4">
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
              <h3 class="font-bold text-indigo-800">Upgrade to Premium</h3>
              <p class="text-sm text-indigo-700 my-2">
                Get access to enhanced analysis, security mode, and more premium features.
              </p>
              <button 
                class="mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                disabled={saveInProgress}
                on:click={handleUpgrade}
              >
                {#if saveInProgress}
                  <span class="inline-block animate-pulse">Processing...</span>
                {:else}
                  Upgrade Now
                {/if}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Preferences -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-4">Preferences</h2>
      <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        
        <!-- Analytics Preference -->
        <div class="flex items-center justify-between py-3">
          <div>
            <h3 class="font-medium">Opt-in to analytics</h3>
            <p class="text-sm text-gray-500">Help us improve by allowing anonymous usage data collection</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              class="sr-only peer" 
              checked={user.preferences.analytics}
              on:change={(e) => updatePreference('analytics', e.currentTarget.checked)}
              disabled={saveInProgress}
            >
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        
        <div class="border-t border-gray-100"></div>
        
        <!-- Security Mode (Premium Only) -->
        <div class="flex items-center justify-between py-3">
          <div>
            <div class="flex items-center">
              <h3 class="font-medium">Security mode</h3>
              {#if !user.isPremium}
                <span class="ml-2 px-2 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded">
                  Premium
                </span>
              {/if}
            </div>
            <p class="text-sm text-gray-500">Store all history locally on your device only</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              class="sr-only peer" 
              checked={user.preferences.securityMode}
              on:change={(e) => updatePreference('securityMode', e.currentTarget.checked)}
              disabled={saveInProgress || !user.isPremium}
            >
            <div class={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${!user.isPremium ? 'opacity-50' : ''}`}></div>
          </label>
        </div>
      </div>
    </div>

    <!-- Save Status -->
    {#if saveSuccess}
      <div class="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md transition-opacity duration-300">
        Settings saved successfully!
      </div>
    {/if}
    
  {/if}
</div>
