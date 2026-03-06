
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import image4 from "../assets/create-new-password.svg";
import { FaEye, FaEyeSlash } from "react-icons/fa";

type LocState = { email?: string; otp?: string };

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = (loc.state as LocState) || {};
  const email = state.email || "your@email.com";
  const otp = state.otp || "";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return false;
    if (newPassword.length < 8) return false;
    if (newPassword !== confirmPassword) return false;
    if (currentPassword === newPassword) return false;
    return true;
  }, [currentPassword, newPassword, confirmPassword]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
        // TODO: real API call here
        await new Promise((r) => setTimeout(r, 900));
        //  Navigate after successful reset
      nav("/reset-success", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <img
              src={image4}
              alt="Reset password illustration"
              className="max-w-full h-auto"
            />
          </div>
        </div>

        {/* Right */}
        <div className="w-full flex flex-col items-center text-center ">
          <h2 className="text-[28px] sm:text-[32px]  font-bold text-[#055160] text-center ">
            Reset Password <br /> & <br /> Create New Password
          </h2>

          <p className="text-[#4B5563] text-[14px] sm:text-[24px] mt-3 text-center ">
            Your new password must be different from <br className="hidden sm:block" />
            previous used password
          </p>

          {/* Card with gradient border */}
          <div className="w-full max-w-xl mt-6 rounded-[10px] bg-gradient-to-b from-[#44A673] via-[#2E967E] to-[#15828A] p-[2px]">
            <div className="rounded-[8px] bg-[#D1E7DD] pt-6 sm:pt-8 pb-6 sm:pb-8 px-5 sm:px-8 lg:px-[40px]">
              <form onSubmit={onSubmit} className="space-y-4 text-left">
                {/* Current Password */}
                <div>
                  <label className="text-[14px] sm:text-[16px] font-normal text-black">
                    Password
                  </label>
                  <div className="mt-2 rounded-[8px] bg-gradient-to-r from-[#44A673] via-[#2E967E] to-[#15828A] p-[1px]">
                    <div className="flex items-center rounded-[8px] bg-white px-3 h-11 sm:h-12">
                      <input
                        className="w-full text-sm outline-none"
                        type={showCurrent ? "text" : "password"}
                        placeholder="Enter Your Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((s) => !s)}
                        className="text-[#055160] opacity-70 hover:opacity-100"
                        aria-label="Toggle password visibility"
                      >
                        {showCurrent ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-[14px] sm:text-[16px] font-normal text-black">
                    New Password
                  </label>
                  <div className="mt-2 rounded-[8px] bg-gradient-to-r from-[#44A673] via-[#2E967E] to-[#15828A] p-[1px]">
                    <div className="flex items-center rounded-[8px] bg-white px-3 h-11 sm:h-12">
                      <input
                        className="w-full text-sm outline-none"
                        type={showNew ? "text" : "password"}
                        placeholder="Enter Your New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((s) => !s)}
                        className="text-[#055160] opacity-70 hover:opacity-100"
                        aria-label="Toggle new password visibility"
                      >
                        {showNew ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-[14px] sm:text-[16px] font-normal text-black">
                    Confirm Password
                  </label>
                  <div className="mt-2 rounded-[8px] bg-gradient-to-r from-[#44A673] via-[#2E967E] to-[#15828A] p-[1px]">
                    <div className="flex items-center rounded-[8px] bg-white px-3 h-11 sm:h-12">
                      <input
                        className="w-full text-sm outline-none"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Enter Your Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        className="text-[#055160] opacity-70 hover:opacity-100"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirm ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                </div>

                {error ? (
                  <div className="text-red-600 text-sm">{error}</div>
                ) : null}

                {/* Submit */}
                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-[244px] h-11 sm:h-12 rounded-[8px] bg-[#055160] text-white hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </button>
                </div>

                {/* optional info / back */}
                <div className="pt-2 text-center lg:text-left text-[12px] text-[#4B5563]">
                  Resetting password for: <span className="font-medium">{email}</span>
                </div>

                <div className="pt-3 flex items-center gap-2 text-[#055160]">
                  <span className="text-xl">←</span>
                  <Link to="/signin" className="text-sm hover:underline">
                    Back to sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Hidden data note (optional) */}
          <div className="sr-only">OTP: {otp}</div>
        </div>
      </div>
    </div>
  );
}
