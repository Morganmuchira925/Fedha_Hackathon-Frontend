import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState } from "react";
import { useConvexAuth } from "convex/react";
import { Navigate } from "react-router-dom";

export default function AuthPage() {
  const { isAuthenticated } = useConvexAuth();
  const [isSignUp, setIsSignUp] = useState(false);

  const backgroundImage = "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=1920&q=80";

  // Highly optimized glassmorphic configuration
  const clerkAppearance = {
    variables: {
      colorPrimary: "#c084fc",
      colorBackground: "transparent", // Lets the backdrop filter shine through entirely
      colorText: "#ffffff",            // Pure white header/primary text
      colorTextSecondary: "#e5e7eb",   // Brightened secondary descriptions
      colorInputBackground: "rgba(255, 255, 255, 0.08)", 
      colorInputText: "#ffffff",
      borderRadius: "0.75rem",
    },
    elements: {
      // The Main Glass Frame
      card: {
        base: "border border-white/15 shadow-2xl shadow-purple-950/40",
        style: {
          backgroundColor: "rgba(18, 16, 26, 0.7)", // Denser base for better text backdrop
          backdropFilter: "blur(20px) saturate(160%)", // Increased blur and saturation for rich separation
          webkitBackdropFilter: "blur(20px) saturate(160%)",
        }
      },
      // FIX: Forces the bottom dark section to be transparent and seamlessly integrate
      footer: {
        style: {
          backgroundColor: "transparent",
          backgroundImage: "none",
        }
      },
      rootBox: {
        base: "p-0 bg-transparent", 
      },
      // Social/Google button text visibility tuning
      socialButtonsBlockButton: {
        base: "border border-white/20 bg-white/10 hover:bg-white/10 transition-all",
      },
      socialButtonsBlockButtonText: {
        style: {
          color: "#ffffff",
          fontWeight: "7",
          letterSpacing: "0.01em"
        }
      },
      formFieldInput: {
        base: "border border-white/10 focus:border-purple-400/50 transition-all text-white placeholder-white/40",
      },
      formFieldLabel: {
        style: {
          color: "#f3f4f6",
          fontWeight: "500"
        }
      },
      formButtonPrimary: {
        base: "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all font-semibold",
      },
      footerActionLink: {
        base: "text-purple-400 hover:text-purple-300 font-semibold",
      },
      dividerLine: {
        base: "bg-white/15",
      },
      dividerText: {
        style: {
          color: "#9ca3af",
          fontWeight: "600"
        }
      },
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div 
      className="fedha-auth-wrapper" 
      style={{ backgroundImage: `linear-gradient(rgba(10, 8, 16, 0.55), rgba(10, 8, 16, 0.75)), url(${backgroundImage})` }}
    >
      <div className="fedha-auth-container">
        
        {/* Left Side: Brand presentation */}
        <div className="fedha-auth-brand-pane">
          <div className="fedha-logo-badge">
            <span className="fedha-logo-icon">💰</span> 
            <span className="fedha-logo-dot">Fedhajamii</span>
          </div>
          <h1 className="fedha-hero-title">
            Intelligent finance for<br />
            <span className="fedha-gradient-text">farmers & brokers</span>
          </h1>
          <p className="fedha-hero-subtitle">
            Track transactions, analyze operational margins, and manage cash flow with smart, voice-driven automated pipelines. Built cleanly for fast execution.
          </p>
          <div className="fedha-auth-footer-links">
            <span>© 2026 Fedha Ltd.</span>
            <a href="#docs">Documentation</a>
            <a href="#privacy">Privacy</a>
          </div>
        </div>
        
        {/* Right Side: Form Pane */}
        <div className="fedha-auth-form-pane">
          {isSignUp ? (
            <div className="fedha-clerk-box">
              <SignUp routing="hash" appearance={clerkAppearance} />
              <p className="fedha-toggle-route-text">
                Already have an account?{" "}
                <button onClick={() => setIsSignUp(false)}>Sign In</button>
              </p>
            </div>
          ) : (
            <div className="fedha-clerk-box">
              <SignIn routing="hash" appearance={clerkAppearance} />
              <p className="fedha-toggle-route-text">
                Don't have an account yet?{" "}
                <button onClick={() => setIsSignUp(true)}>Sign Up</button>
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}