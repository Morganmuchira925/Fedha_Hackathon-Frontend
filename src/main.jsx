import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 1. Import the Clerk and Convex packages
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

// 2. Initialize the Convex Client using your environment variable
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// 3. Grab your Clerk Publishable Key from environment variables
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 4. Wrap the app so Clerk handles session tokens */}
    <ClerkProvider publishableKey={clerkPublishableKey}>
      {/* 5. Wrap the app so Convex securely receives those auth tokens */}
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <App />
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>
)