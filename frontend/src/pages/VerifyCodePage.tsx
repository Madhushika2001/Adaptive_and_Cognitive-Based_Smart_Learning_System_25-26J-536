import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store/store";
import { resetPasswordForEmail } from "../store/thunks/authThunks";
import image4 from "../assets/reset-password.svg";
import { FaEnvelopeOpenText } from "react-icons/fa";

type LocState = { email?: string };

export default function VerifyCodePage() {
  const loc = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const state = (loc.state as LocState) || {};
  const email = state.email || "your@email.com";

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setError(null);
    setResent(false);
    setResending(true);
    try {
      await dispatch(resetPasswordForEmail({ email })).unwrap();
      setResent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to resend email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-10 py-8 lg:py-[52px] font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[34px] items-center">
        {/* Left */}
        <div className="w-full flex flex-col items-center lg:items-start">
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold bg-gradient-to-b from-[#44A673] via-[#2E967E] to-[#15828A] bg-clip-text text-transparent">
            CogniLearn !
          </h1>

          <div className="mt-8 lg:mt-12 w-full flex justify-center lg:justify-start">
            <img src={image4} alt="Illustration" className="max-w-full h-auto" />
          </div>
        </div>

        {/* Right */}
        <div className="w-full flex flex-col items-center lg:items-start">
          <h2 className="text-[28px] sm:text-[32px] font-bold text-[#055160]">
            Check Your Email
          </h2>

          {/* Email icon */}
          <div className="mt-6">
            <div className="w-16 h-16 rounded-full bg-[#2E967E] flex items-center justify-center text-white">
              <FaEnvelopeOpenText size={22} />
            </div>
          </div>

          <h3 className="mt-5 text-[#055160] text-[18px] sm:text-[20px] font-semibold">
            Password Reset Link Sent
          </h3>

          <p className="text-[#4B5563] text-[13px] sm:text-[15px] mt-3 text-center lg:text-left max-w-md leading-relaxed">
            We've sent a password reset link to{" "}
            <span className="font-semibold text-[#055160]">{email}</span>.
            <br />
            Please check your inbox and click the link to reset your password.
          </p>

          <p className="text-[#4B5563] text-[12px] sm:text-[13px] mt-4 text-center lg:text-left max-w-md">
            Didn't receive the email? Check your spam folder or try again.
          </p>

          <div className="w-full max-w-xl mt-6 space-y-4">
            {error && (
              <div className="text-red-600 text-sm text-center lg:text-left">
                {error}
              </div>
            )}

            {resent && !error && (
              <div className="text-[#2E967E] text-sm text-center lg:text-left font-medium">
                A new reset link has been sent to your email.
              </div>
            )}

            {/* Resend button */}
            <div className="flex justify-center lg:justify-start">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full sm:w-[244px] h-12 sm:h-14 rounded-[8px] bg-[#055160] text-white hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {resending ? "Sending..." : "Resend Email"}
              </button>
            </div>

            {/* Back */}
            <div className="pt-2 flex items-center gap-2 text-[#055160]">
              <span className="text-xl">←</span>
              <Link to="/signin" className="text-sm hover:underline">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
