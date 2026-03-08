import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store/store";
import { signUp } from "../store/thunks/authThunks";
import image3 from "../assets/image 3.svg";
import Google from "../assets/Google.svg";
import Fb from "../assets/Fb.svg";

export default function SignUpPage() {
  const nav = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim() || !email.trim() || !pw.trim()) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    if (pw !== pw2) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (pw.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const result = await dispatch(signUp({ email, password: pw, fullName: name }));
      
      if (signUp.fulfilled.match(result)) {
        alert("Sign up successful! Please check your email for verification.");
        nav("/login", { replace: true });
      } else if (signUp.rejected.match(result)) {
        setError(result.payload as string);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-10 py-8 lg:py-[52px] font-sans">
      {/* Outer container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[34px] items-center">
        {/* Left section (hidden on mobile, shows on lg+) */}
        <div className="hidden lg:block">
          <h1 className="text-4xl lg:text-[64px] font-extrabold leading-tight">
            <span className="block text-[#087990]">Welcome To</span>
            <span className="block mt-16 text-right bg-gradient-to-b from-[#44A673] via-[#2E967E] to-[#15828A] bg-clip-text text-transparent">
              CogniLearn!
            </span>
          </h1>

          <div className="mt-12 p-2 xl:p-6">
            <img
              src={image3}
              alt="Illustration"
              className="w-full max-w-[584px] h-auto"
            />
          </div>
        </div>

        {/* Right form section */}
        <div className="w-full flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#055160] text-center">
            Student Sign Up
          </h2>

          <div className="flex items-center justify-center text-sm sm:text-base lg:text-[18px] mt-2 mb-4 text-center flex-wrap gap-2">
            <span className="text-[#055160]">Already have Account?</span>
            <Link to="/login" className="text-[#055160] font-normal underline">
              Sign In
            </Link>
          </div>

          {/* Gradient border wrapper (2px) */}
          <div className="w-full max-w-xl rounded-[10px] bg-gradient-to-b from-[#44A673] via-[#2E967E] to-[#15828A] p-[2px]">
            {/* Card */}
            <div className="rounded-[8px] bg-[#D1E7DD] pt-6 sm:pt-8 pb-6 sm:pb-[30px] px-5 sm:px-8 lg:px-[54px]">
              <form onSubmit={onSubmit} className=" space-y-4 text-left">
                <div>
                  <label className="text-base sm:text-lg lg:text-[20px] font-normal text-black ">
                    Name
                  </label>
                  <div className="mt-2 rounded-[8px] bg-gradient-to-r from-[#44A673] via-[#2E967E] to-[#15828A] p-[1px]">
                    <input
                      className="w-full h-10 sm:h-12 md:h-14 lg:h-16 rounded-[8px] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#087990]/20"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-base sm:text-lg lg:text-[20px] font-normal text-black">
                    Email
                  </label>
                  <div className="mt-2 rounded-[8px] bg-gradient-to-r from-[#44A673] via-[#2E967E] to-[#15828A] p-[1px]">
                    <input
                      className="w-full h-10 sm:h-12 md:h-14 lg:h-16 rounded-[8px] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#087990]/20"
                      type="email"
                      placeholder="you@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>{" "}
                </div>

                <div>
                  <label className="text-base sm:text-lg lg:text-[20px] font-normal text-black">
                    Password
                  </label>
                  <div className="mt-2 rounded-[8px] bg-gradient-to-r from-[#44A673] via-[#2E967E] to-[#15828A] p-[1px]">
                    <input
                      className="w-full h-10 sm:h-12 md:h-14 lg:h-16 rounded-[8px] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#087990]/20"
                      type="password"
                      placeholder="••••••••"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="text-base sm:text-lg lg:text-[20px] font-normal text-black">
                    Confirm Password
                  </label>
                  <div className="mt-2 rounded-[8px] bg-gradient-to-r from-[#44A673] via-[#2E967E] to-[#15828A] p-[1px]">
                    <input
                      className="w-full h-10 sm:h-12 md:h-14 lg:h-16 rounded-[8px] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#087990]/20"
                      type="password"
                      placeholder="••••••••"
                      value={pw2}
                      onChange={(e) => setPw2(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Button (responsive width) */}
                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-[244px] h-14 sm:h-16 rounded-[8px] bg-[#055160] cursor-pointer text-white font-normal text-base sm:text-[20px] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 pt-4 sm:pt-[17px]">
                  <div className="h-px flex-1 bg-[#4B5563]" />
                  <span className="text-base sm:text-[20px] font-normal text-[#4B5563] whitespace-nowrap">
                    Or Sign Up With
                  </span>
                  <div className="h-px flex-1 bg-[#4B5563]" />
                </div>

                {/* Social icons */}
                <div className="flex items-center justify-center gap-5 pt-4">
                  <button
                    type="button"
                    className="w-10 h-10 sm:w-[40px] sm:h-[40px]
               flex items-center justify-center cursor-pointer"
                    aria-label="Sign up with Google"
                  >
                    <img src={Google} className="w-10 h-10" alt="Google" />
                  </button>

                  <button
                    type="button"
                    className="w-12 h-12 sm:w-[50px] sm:h-[50px]
               flex items-center justify-center cursor-pointer"
                    aria-label="Sign up with Facebook"
                  >
                    <img
                      src={Fb}
                      className="w-[50px] h-[50px]"
                      alt="Facebook"
                    />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Optional: show illustration below form on mobile */}
          <div className="lg:hidden mt-8 w-full max-w-md">
            <img src={image3} alt="Illustration" className="w-full h-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
