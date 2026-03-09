import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store/store";
import { signIn } from "../store/thunks/authThunks";
import image4 from "../assets/image 4.svg";
import Google from "../assets/Google.svg";
import Fb from "../assets/Fb.svg";

export default function SignInPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = (loc.state as any)?.from?.pathname || "/";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      const result = await dispatch(signIn({ email, password }));

      if (signIn.fulfilled.match(result)) {
        // Successfully logged in - redirect to model paper page
        nav(from, { replace: true });
      } else if (signIn.rejected.match(result)) {
        // Handle rejection with error message from payload
        setError(result.payload as string);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-10 py-8 lg:py-[52px] font-sans">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[34px] items-center">
        <div className="w-full flex flex-col items-center">
          {" "}
          <h2 className="text-[32px] font-bold  text-[#055160]">
            Student Sign In
          </h2>
          <p className="text-[16px] text-[#055160] my-5">
            Welcome back! Please log in to your account.
          </p>
          <div className="w-full max-w-xl rounded-[10px] bg-gradient-to-b from-[#44A673] via-[#2E967E] to-[#15828A] p-[2px]">
            {/* Card */}
            <div className="rounded-[8px] bg-[#D1E7DD] pt-6 sm:pt-14 pb-6 sm:pb-[56px] px-5 sm:px-8 lg:px-[52px]">
              <form onSubmit={onSubmit} className=" space-y-4 text-left">
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
                  </div>
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <label className="flex cursor-pointer items-center gap-2 lg:ml-3 font-[400] text-[10px] sm:text-[12px] md:text-[14px] lg:text-[16px] text-[#4B5563]">
                      <input
                        type="checkbox"
                        className="w-[21px] h-[18px] cursor-pointer rounded appearance-none border-[1px] border-transparent bg-white checked:bg-red-400 "
                        style={{
                          borderImageSlice: 1,
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderImageSource:
                            "linear-gradient(180deg, #44A673 0%, #2E967E 49%, #15828A 100%)",
                        }}
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => nav("/forgot-password")}
                      className="text-[#4B5563] cursor-pointer lg:mr-3 text-[10px] sm:text-[12px] md:text-[14px] lg:text-[16px] font-[400] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-[244px] h-14 sm:h-16 rounded-[8px] bg-[#055160] cursor-pointer text-white font-normal text-base sm:text-[20px] hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Signing In..." : "Login"}
                  </button>{" "}
                </div>

                <div className="flex items-center gap-3 pt-4 sm:pt-[17px]">
                  <div className="h-px flex-1 bg-[#4B5563]" />
                  <span className="text-base sm:text-[20px] font-normal text-[#4B5563] whitespace-nowrap">
                    Or Sign Up With
                  </span>
                  <div className="h-px flex-1 bg-[#4B5563]" />
                </div>

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

                <p className="text-[12px] sm:text-[14px] md:text-[16px] lg:text-[18px] text-[#055160] text-center font-[400] mt-6">
                  Don’t have an account?{" "}
                  <Link
                    className="text-[#055160] ml-10 underline font-[400]"
                    to="/signup"
                  >
                    Sign Up
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
        {/* Right form */}
        <div className="block text-center">
          <h1 className="text-4xl hidden md:block lg:text-[64px] font-extrabold bg-gradient-to-b from-[#44A673] via-[#2E967E] to-[#15828A] bg-clip-text text-transparent">
            Welcome Back!
          </h1>
          {/* <p className="mt-3 text-gray-600">
            Please log in to your account to continue.
          </p> */}

          {/* If you have an image like your mockup, put it here */}
          <div className="sm:mt-12 md:mt-16 lg:mt-32 rounded-2xl w-full p-6 ">
            {/* <div className="h-64 w-full bg-[#EAF6F1] rounded-xl" /> */}
            <img
              src={image4}
              alt="Illustration"
              className="max-w-full h-auto  mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
