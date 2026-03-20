'use client';

import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '../components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ─── Carousel Slides ──────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: '💒',
    title: 'Welcome Back',
    subtitle: 'Thousands of Nadar families trust us to find meaningful, lasting connections.',
  },
  {
    icon: '🌟',
    title: 'Your Journey Continues',
    subtitle: 'New verified profiles are added every day. Your perfect match could be waiting.',
  },
  {
    icon: '💍',
    title: 'Built on Trust',
    subtitle: 'Every profile is reviewed. Every connection is meaningful.',
  },
];

// ─── Validation ───────────────────────────────────────────────────────────────

const schema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
});

// ─── Carousel ─────────────────────────────────────────────────────────────────

function Carousel() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="hidden lg:flex flex-col h-full"
      style={{ background: 'linear-gradient(150deg, #D72638 0%, #8B1520 100%)' }}
    >
      {/* Logo */}
      <div className="px-10 pt-10 flex-none">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <span style={{ color: '#D4AF37', fontSize: '1.5rem', fontWeight: 700 }}>✦</span>
          <span className="text-white font-semibold text-base tracking-wide">
            Angel Nadar Matrimony
          </span>
        </Link>
      </div>

      {/* Slide */}
      <div className="flex-1 flex items-center justify-center px-12">
        <div className="text-center text-white max-w-sm">
          <div key={slide} style={{ animation: 'fadeIn 0.6s ease' }}>
            <div className="text-8xl mb-8 drop-shadow-lg">{SLIDES[slide].icon}</div>
            <h2 className="text-3xl font-bold leading-tight mb-4">{SLIDES[slide].title}</h2>
            <p className="text-white/75 text-base leading-relaxed">{SLIDES[slide].subtitle}</p>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 pb-12 flex-none">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`rounded-full transition-all duration-300 ${
              i === slide ? 'w-7 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/35 hover:bg-white/55'
            }`}
          />
        ))}
      </div>

      {/* Stat bar */}
      <div className="flex-none border-t border-white/15 px-10 py-6 grid grid-cols-3 gap-4 text-center">
        {[
          { num: '10K+', label: 'Profiles' },
          { num: '2K+', label: 'Marriages' },
          { num: '100%', label: 'Free' },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-xl font-bold text-white">{s.num}</div>
            <div className="text-xs text-white/60 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      router.replace('/dashboard');
    }
  }, [router]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: schema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message ?? 'Invalid email or password.');
        }

        const { access_token } = await res.json();
        localStorage.setItem('access_token', access_token);
        router.push('/dashboard');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Something went wrong.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const inputCls = (field: 'email' | 'password') =>
    `w-full px-3 py-2.5 rounded-lg border text-sm text-text bg-white outline-none transition-all ${
      formik.touched[field] && formik.errors[field]
        ? 'border-red-400 focus:ring-2 focus:ring-red-200'
        : 'border-border focus:border-primary focus:ring-2 focus:ring-[#D72638]/15'
    }`;

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="w-5/12 flex-none sticky top-0 h-screen">
        <Carousel />
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col bg-background min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-none">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="text-accent font-bold text-xl">✦</span>
            <span className="font-semibold text-sm text-text">Angel Nadar Matrimony</span>
          </Link>
          <div className="hidden lg:block" />
          <p className="text-sm text-text-secondary">
            New here?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Register Free
            </Link>
          </p>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 bg-secondary text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-primary/20">
                ✦ Angel Nadar Matrimony
              </div>
              <h1 className="text-3xl font-bold text-text">Welcome back</h1>
              <p className="text-text-secondary text-sm mt-2">
                Sign in to continue finding your perfect match.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={formik.handleSubmit} noValidate className="flex flex-col gap-5">
              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-text">
                  Email Address <span className="text-primary">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="arjun@example.com"
                  autoComplete="email"
                  className={inputCls('email')}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span>⚠</span> {formik.errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text">
                    Password <span className="text-primary">*</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`${inputCls('password')} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <span>⚠</span> {formik.errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="w-full py-3 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-1"
              >
                {formik.isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-muted">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Register CTA */}
            <div className="bg-secondary rounded-xl px-5 py-4 text-center border border-primary/10">
              <p className="text-sm text-text-secondary">
                Don't have an account?{' '}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Register for free
                </Link>
              </p>
              <p className="text-xs text-text-muted mt-1">No credit card required. Always free.</p>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-text-muted mt-6">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">Terms</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
