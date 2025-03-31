// User interface with premium status and other user info
export interface User {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  premiumExpiry: Date | null;
  preferences: {
    analytics: boolean;
    securityMode: boolean;  // Local storage only mode (premium feature)
  }
}

// Default free user
const DEFAULT_USER: User = {
  id: "user_123",
  name: "Demo User",
  email: "user@example.com",
  isPremium: false,
  premiumExpiry: null,
  preferences: {
    analytics: true,
    securityMode: false,
  }
};

// Mock premium user for testing
const PREMIUM_USER: User = {
  id: "premium_456",
  name: "Premium User",
  email: "premium@example.com",
  isPremium: true,
  premiumExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  preferences: {
    analytics: true,
    securityMode: true,
  }
};

// Use this in development to toggle between free/premium users
const USE_PREMIUM_USER_FOR_TESTING = false;

class UserService {
  private user: User;

  constructor() {
    this.user = USE_PREMIUM_USER_FOR_TESTING ? PREMIUM_USER : DEFAULT_USER;
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User> {
    // Simulate API delay
    return new Promise(resolve => {
      setTimeout(() => resolve({...this.user}), 300);
    });
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<User['preferences']>): Promise<User> {
    // Simulate API delay
    return new Promise(resolve => {
      this.user = {
        ...this.user,
        preferences: {
          ...this.user.preferences,
          ...preferences
        }
      };
      setTimeout(() => resolve({...this.user}), 300);
    });
  }

  /**
   * Simulate upgrading to premium (in real app would connect to payment provider)
   */
  async upgradeToPremium(): Promise<User> {
    return new Promise(resolve => {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      this.user = {
        ...this.user,
        isPremium: true,
        premiumExpiry: oneYearFromNow
      };
      
      setTimeout(() => resolve({...this.user}), 500);
    });
  }

  /**
   * Format date for display
   */
  static formatExpiryDate(date: Date | null): string {
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  }
}

export const userService = new UserService();
