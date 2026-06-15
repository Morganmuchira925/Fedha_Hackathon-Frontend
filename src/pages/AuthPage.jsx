import { SignIn, SignUp } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useConvexAuth } from "convex/react";
import { Navigate } from "react-router-dom";

// Fintech for small-scale traders & informal vendors: market stalls, cash handling, mobile tracking
const BACKGROUND_IMAGES = [
  "https://images.pexels.com/photos/36943009/pexels-photo-36943009.jpeg?auto=format&fit=crop&w=1920&q=80",
  "https://images.pexels.com/photos/32370972/pexels-photo-32370972.jpeg?auto=format&fit=crop&w=1920&q=80",
  "https://images.pexels.com/photos/20068076/pexels-photo-20068076.jpeg?auto=format&fit=crop&w=1920&q=80",
  "https://images.pexels.com/photos/33063798/pexels-photo-33063798.jpeg?auto=format&fit=crop&w=1920&q=80",
  "https://images.pexels.com/photos/15612248/pexels-photo-15612248.jpeg?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1920&q=80"
];

export default function AuthPage() {
  const { isAuthenticated } = useConvexAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  // Background cross-fade
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex + 1) % BACKGROUND_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const clerkAppearance = {
    variables: {
      colorPrimary: "#c084fc",
      colorBackground: "transparent", 
      colorText: "#ffffff",            
      colorTextSecondary: "#e5e7eb",   
      colorInputBackground: "rgba(255, 255, 255, 0.08)", 
      colorInputText: "#ffffff",
      borderRadius: "0.75rem",
    },
    elements: {
      card: {
        base: "border border-white/15 shadow-2xl shadow-purple-950/40",
        style: {
          backgroundColor: "rgba(18, 16, 26, 0.7)", 
          backdropFilter: "blur(20px) saturate(160%)", 
          webkitBackdropFilter: "blur(20px) saturate(160%)",
        }
      },
      footer: {
        style: {
          backgroundColor: "transparent",
          backgroundImage: "none",
        }
      },
      rootBox: {
        base: "p-0 bg-transparent", 
      },
      socialButtonsBlockButton: {
        base: "border border-white/20 bg-white/10 hover:bg-white/10 transition-all",
      },
      socialButtonsBlockButtonText: {
        style: {
          color: "#ffffff",
          fontWeight: "700", 
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
    <div className="relative w-screen min-h-screen bg-[#0c0a14] flex items-center justify-center overflow-x-hidden">
      
      {/* Background Images with stronger overlay for market scenes */}
      {BACKGROUND_IMAGES.map((imgUrl, index) => (
        <div
          key={imgUrl}
          className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat pointer-events-none transition-opacity duration-[1500ms] ease-in-out"
          style={{
            backgroundImage: `linear-gradient(to bottom right, rgba(12, 10, 20, 0.78), rgba(8, 6, 12, 0.92)), url(${imgUrl})`,
            opacity: bgIndex === index ? 1 : 0,
            zIndex: 0
          }}
        />
      ))}

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center p-6 md:p-12 lg:p-8 min-h-[85vh]">
        
        {/* Left Side - Tailored for Small-scale Traders & Informal Vendors */}
        <div className="flex flex-col justify-center lg:min-h-[520px]">
          <div>
            {/* Fancy Fedhajamii Logo Text */}
            <div className="mb-8 lg:mb-12">
              <h2 
                className="text-[2.75rem] lg:text-[3.5rem] font-black tracking-[-0.04em] 
                           bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-pink-200 
                           drop-shadow-[0_4px_12px_rgba(192,132,252,0.4)]"
                style={{ 
                  fontFamily: "'Playfair Display', 'Georgia', serif",
                  letterSpacing: '-0.04em'
                }}
              >
                Fedhajamii
              </h2>
              <div className="h-0.5 w-16 bg-gradient-to-r from-purple-400 to-pink-400 mt-2" />
            </div>
            
            <h1 className="text-[2.25rem] lg:text-[2.75rem] font-extrabold tracking-tight text-white leading-[1.12]">
              Simple cash flow tracking <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-200">
                for traders &amp; vendors
              </span>
            </h1>
            
            <p className="mt-6 text-base lg:text-lg text-slate-200/90 leading-relaxed max-w-[460px] font-light">
              Stop guessing your profits. Track every sale, expense, and daily cash flow with an easy tool built for small-scale traders and informal vendors.
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-6 mt-10 pt-6 border-t border-white/10 max-w-sm">
              <div>
                <p className="text-[1.35rem] lg:text-[1.5rem] font-bold text-white">Daily</p>
                <p className="text-[10px] text-purple-300 tracking-wider uppercase font-semibold mt-1">Cash Flow</p>
              </div>
              <div>
                <p className="text-[1.35rem] lg:text-[1.5rem] font-bold text-white">Profit</p>
                <p className="text-[10px] text-purple-300 tracking-wider uppercase font-semibold mt-1">Insights</p>
              </div>
              <div>
                <p className="text-[1.35rem] lg:text-[1.5rem] font-bold text-white">Simple</p>
                <p className="text-[10px] text-purple-300 tracking-wider uppercase font-semibold mt-1">Expense Log</p>
              </div>
              <div>
                <p className="text-[1.35rem] lg:text-[1.5rem] font-bold text-white">Mobile</p>
                <p className="text-[10px] text-purple-300 tracking-wider uppercase font-semibold mt-1">First</p>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-12 lg:mt-16 flex items-center gap-3 text-xs text-slate-400 font-medium">
            <span>© 2026 Fedha Ltd.</span>
            <span className="text-white/10">•</span>
            <a href="#docs" className="hover:text-purple-300 transition-colors">Documentation</a>
            <span className="text-white/10">•</span>
            <a href="#privacy" className="hover:text-purple-300 transition-colors">Privacy</a>
          </div>
        </div>
        
        {/* Right Side - Auth Form (styling untouched) */}
        <div className="flex flex-col items-center justify-center w-full">
          {isSignUp ? (
            <div className="w-full flex flex-col items-center">
              <SignUp routing="hash" appearance={clerkAppearance} />
              <p className="mt-6 text-sm text-slate-300">
                Already have an account?{" "}
                <button 
                  onClick={() => setIsSignUp(false)}
                  className="bg-none border-none text-purple-400 hover:text-purple-300 font-semibold underline px-1 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <SignIn routing="hash" appearance={clerkAppearance} />
              <p className="mt-6 text-sm text-slate-300">
                Don't have an account yet?{" "}
                <button 
                  onClick={() => setIsSignUp(true)}
                  className="bg-none border-none text-purple-400 hover:text-purple-300 font-semibold underline px-1 transition-colors cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}