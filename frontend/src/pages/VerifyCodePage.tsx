import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import image4 from "../assets/reset-password.svg";
import { FaLock } from "react-icons/fa";

type LocState = { email?: string };

export default function VerifyCodePage() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = (loc.state as LocState) || {};
  const email = state.email || "your@email.com";

  const OTP_LEN = 4;
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const otpValue = useMemo(() => otp.join(""), [otp]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function setAt(index: number, value: string) {
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleChange(index: number, value: string) {
    setError(null);
    const v = value.replace(/\D/g, "");
    if (!v) {
      setAt(index, "");
      return;
    }

    const chars = v.split("");
    for (let i = 0; i < chars.length; i++) {
      const pos = index + i;
      if (pos < OTP_LEN) setAt(pos, chars[i]);
    }

    const nextIndex = Math.min(index + chars.length, OTP_LEN - 1);
    inputsRef.current[nextIndex]?.focus();
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace") {
      if (otp[index]) {
        setAt(index, "");
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        setAt(index - 1, "");
      }
    }
    if (e.key === "ArrowLeft" && index > 0)
      inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LEN - 1)
      inputsRef.current[index + 1]?.focus();
  }

  function handlePaste(index: number, e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;

    const chars = text.slice(0, OTP_LEN - index).split("");
    for (let i = 0; i < chars.length; i++) {
      setAt(index + i, chars[i]);
    }
    const last = Math.min(index + chars.length - 1, OTP_LEN - 1);
    inputsRef.current[last]?.focus();
  }

async function verifyOtp() {
  setError(null);

  if (otpValue.length !== OTP_LEN || otp.some((d) => d === "")) {
    setError("Please enter the 4-digit code.");
    return;
  }

  setLoading(true);
  try {
    // TODO: replace with real API call
    // const res = await fetch("/api/auth/verify-otp", {...})

    await new Promise((r) => setTimeout(r, 800));

    // ✅ Move to Reset Password page
    nav("/reset-password", { state: { email, otp: otpValue } });

  } catch (err: any) {
    setError(err?.message || "Invalid code. Please try again.");
  } finally {
    setLoading(false);
  }
}


  async function resendOtp() {
    setError(null);
    setOtp(Array(OTP_LEN).fill(""));
    inputsRef.current[0]?.focus();
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-10 py-8 lg:py-[52px] font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[34px] items-center">
        {/* Left */}
        <div className="w-full flex flex-col items-center lg:items-start">
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold bg-gradient-to-b from-[#44A673] via-[#2E967E] to-[#15828A] bg-clip-text text-transparent">
            CongiLearn !
          </h1>

          <div className="mt-8 lg:mt-12 w-full flex justify-center lg:justify-start">
            <img src={image4} alt="Illustration" className="max-w-full h-auto" />
          </div>
        </div>

        {/* Right */}
        <div className="w-full flex flex-col items-center lg:items-start">
          <h2 className="text-[28px] sm:text-[32px] font-bold text-[#055160]">
            Forget Password
          </h2>

          {/* Lock icon */}
          <div className="mt-6">
            <div className="w-16 h-16 rounded-full bg-[#2E967E] flex items-center justify-center text-white">
              <FaLock size={22} />
            </div>
          </div>

          <h3 className="mt-5 text-[#055160] text-[18px] sm:text-[20px] font-semibold">
            Verification code
          </h3>

          <p className="text-[#4B5563] text-[12px] sm:text-[14px] mt-2 text-center lg:text-left">
            The verification code was sent to {email}
          </p>

          <div className="w-full max-w-xl mt-5">
            {/* OTP boxes */}
            <div className="flex gap-4 justify-center lg:justify-start mt-4">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={(e) => handlePaste(i, e)}
                  inputMode="numeric"
                  maxLength={4}
                  className="w-14 h-12 sm:w-16 sm:h-14 rounded-[8px] bg-white text-center text-lg outline-none border border-[#A3D2C5] focus:ring-2 focus:ring-[#087990]/20"
                />
              ))}
            </div>

            {error ? (
              <div className="text-red-600 text-sm mt-3 text-center lg:text-left">
                {error}
              </div>
            ) : null}

            {/* Verify button */}
            <div className="flex justify-center lg:justify-start mt-6">
              <button
                onClick={verifyOtp}
                disabled={loading}
                className="w-full sm:w-[244px] h-12 sm:h-14 rounded-[8px] bg-[#055160] text-white hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </div>

            {/* Resend */}
            <div className="mt-4 text-center lg:text-left text-[12px] sm:text-[14px] text-[#055160]">
              Didn’t receive the code ?{" "}
              <button
                onClick={resendOtp}
                className="font-semibold hover:underline"
              >
                Resend OTP
              </button>
            </div>

            {/* Back */}
            <div className="pt-5 flex items-center gap-2 text-[#055160]">
              <span className="text-xl">←</span>
              <Link to="/signin" className="text-sm hover:underline">
                Back to sing in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
