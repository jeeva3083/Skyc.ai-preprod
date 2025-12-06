import React, { useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/authConfig";
import { ShieldCheck, Lock, Activity, AlertCircle, Ghost, Loader2, RefreshCw } from "lucide-react";
import { InteractionStatus } from "@azure/msal-browser";

interface LoginProps {
  onDemoLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onDemoLogin }) => {
  const { instance, inProgress } = useMsal();
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (inProgress !== InteractionStatus.None) {
        setError("Login in progress...");
        return;
    }

    setError(null);
    try {
      await instance.loginPopup(loginRequest);
    } catch (e: any) {
      console.error("Login failed:", e);
      
      // Handle specific error codes
      if (e.errorCode === "interaction_in_progress") {
        setError("Authentication is already in progress. Try the Reset button below.");
      } else if (e.errorCode === "user_cancelled") {
        setError("Sign-in cancelled. Use Guest Access to continue.");
      } else if (e.errorCode === "popup_window_error") {
        setError("Popup was blocked. Please allow popups for this application.");
      } else {
        setError(e.message || "Authentication unavailable. Please use Guest Access.");
      }
    }
  };

  const handleResetSession = () => {
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
  };

  const isLoggingIn = inProgress !== InteractionStatus.None;

  return (
    <div className="h-screen w-screen bg-[#0f111a] flex items-center justify-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_#2e1065_0%,_#0f111a_60%)] opacity-60"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150"></div>
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-8 text-center relative overflow-hidden group">
          
          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-emerald-500 to-purple-600"></div>

          <div className="space-y-2">
            <div className="flex justify-center mb-6">
               <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
                  <Activity className="text-white" size={32} />
               </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Skyc.ai</h1>
            <p className="text-slate-400 text-sm font-light">Enterprise Neural Workspace</p>
          </div>

          <div className="space-y-3">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex flex-col items-center justify-center space-y-2 text-xs text-red-300 animate-fade-in">
                <div className="flex items-center space-x-2">
                    <AlertCircle size={14} />
                    <span>{error}</span>
                </div>
                {error.includes("progress") && (
                    <button onClick={handleResetSession} className="text-xs underline hover:text-white">Click here to reset session</button>
                )}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className={`w-full flex items-center justify-center space-x-3 bg-white text-slate-900 font-semibold py-3.5 px-4 rounded-lg transition-all duration-200 shadow-xl group/btn ${isLoggingIn ? 'opacity-70 cursor-wait' : 'hover:bg-slate-100 hover:scale-[1.02]'}`}
            >
              {isLoggingIn ? (
                 <Loader2 className="animate-spin text-slate-900" size={20} />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0H10.8879V10.8879H0V0Z" fill="#F25022"/>
                  <path d="M12.1121 0H23V10.8879H12.1121V0Z" fill="#7FBA00"/>
                  <path d="M0 12.1121H10.8879V23H0V12.1121Z" fill="#00A4EF"/>
                  <path d="M12.1121 12.1121H23V23H12.1121V12.1121Z" fill="#FFB900"/>
                </svg>
              )}
              <span>{isLoggingIn ? "Signing in..." : "Sign in with Microsoft Entra ID"}</span>
            </button>
            
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              onClick={onDemoLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-3 bg-white/5 text-slate-300 font-medium py-3 px-4 rounded-lg hover:bg-white/10 hover:text-white transition-all duration-200 border border-white/10 disabled:opacity-50"
            >
              <Ghost size={18} />
              <span>Continue as Guest</span>
            </button>

            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-4 cursor-pointer hover:text-slate-400" onClick={handleResetSession} title="Reset Auth Cache">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Multi-Tenant Secure Uplink</span>
            </div>
          </div>

          {/* Decorative Footer */}
          <div className="absolute bottom-0 left-0 w-full p-4 bg-white/5 border-t border-white/5">
             <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase">
                <span>V.1.0.4</span>
                <span className="flex items-center gap-1"><Lock size={8}/> Encrypted</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};