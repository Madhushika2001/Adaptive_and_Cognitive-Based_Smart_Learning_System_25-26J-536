import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store/store";
import { resetPasswordForEmail } from "../store/thunks/authThunks";
import image4 from "../assets/reset-password.svg"; // use your illustration (or replace)

export default function ForgotPasswordPage() {
  const nav = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await dispatch(resetPasswordForEmail({ email })).unwrap();
      nav("/verify-code", { state: { email } });
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
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
            CogniLearn !
          </h1>

          <div className="mt-8 lg:mt-12 w-full flex justify-center lg:justify-start">
            <img
              src={image4}
              alt="Forgot password illustration"
              className="max-w-full h-auto"
            />
          </div>
        </div>

        {/* Right */}
        <div className="w-full flex flex-col items-center lg:items-start">
          <h2 className="text-[28px] sm:text-[32px] font-bold text-[#055160]">
            Forget Password
          </h2>
          <p className="text-[14px] sm:text-[16px] text-[#055160] mt-2 mb-5">
            Enter your email address, and we’ll give you reset instruction
          </p>

          <div className="w-full max-w-xl rounded-[10px] bg-gradient-to-b from-[#44A673] via-[#2E967E] to-[#15828A] p-[2px]">
            <div className="rounded-[8px] bg-[#D1E7DD] pt-6 sm:pt-10 pb-6 sm:pb-10 px-5 sm:px-8 lg:px-[52px]">
              {!sent ? (
                <form onSubmit={onSubmit} className="space-y-4 text-left">
                  <div>
                    <label className="text-base sm:text-lg lg:text-[18px] font-normal text-black">
                      Enter Your Email
                    </label>
                    <div className="mt-2 rounded-[8px] bg-gradient-to-r from-[#44A673] via-[#2E967E] to-[#15828A] p-[1px]">
                      <input
                        className="w-full h-10 sm:h-12 md:h-14 rounded-[8px] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#087990]/20"
                        type="email"
                        placeholder="Enter Your Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {error ? (
                    <div className="text-red-600 text-sm">{error}</div>
                  ) : null}

                  <div className="flex justify-center pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-[244px] h-12 sm:h-14 rounded-[8px] bg-[#055160] cursor-pointer text-white font-normal text-base sm:text-[18px] hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? "Sending..." : "Send Code"}
                    </button>
                  </div>

                  <div className="pt-2 flex items-center gap-2 text-[#055160]">
                    <span className="text-xl">←</span>
                    <Link
                      to="/signin"
                      className="text-[12px] sm:text-[14px] hover:underline"
                    >
                      Back to sing in
                    </Link>
                  </div>
                </form>
              ) : (
                <div className="text-left space-y-3">
                  <h3 className="text-[#055160] text-[18px] sm:text-[20px] font-semibold">
                    Code sent!
                  </h3>
                  <p className="text-[#055160] text-sm sm:text-base">
                    We sent a reset code to <b>{email}</b>. Please check your inbox.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => nav("/signin")}
                      className="w-full sm:w-[244px] h-12 sm:h-14 rounded-[8px] bg-[#055160] text-white hover:opacity-95"
                    >
                      Go to Sign In
                    </button>
                    <button
                      onClick={() => setSent(false)}
                      className="w-full sm:w-[244px] h-12 sm:h-14 rounded-[8px] bg-white text-[#055160] border border-[#055160] hover:bg-[#eef7f2]"
                    >
                      Send again
                    </button>
                  </div>

                  <div className="pt-2 flex items-center gap-2 text-[#055160]">
                    <span className="text-xl">←</span>
                    <Link to="/signin" className="text-sm hover:underline">
                      Back to sing in
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
