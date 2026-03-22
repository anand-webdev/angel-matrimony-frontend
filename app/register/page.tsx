'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormik, FormikProps } from 'formik';
import * as Yup from 'yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '../components/Button';
import { Field, TextInput, SelectInput, Textarea } from '../components/Input';
import { useToast } from '../components/Toast';
import { useLookups } from '../providers/LookupProvider';
import { lookupOptions } from '../lib/lookups';

// ─── Constants ────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const GENDERS = ['MALE', 'FEMALE'] as const;

const EDUCATIONS = ["High School", "Diploma", "Bachelor's", "Master's", "PhD", "Other"];
const ANNUAL_INCOMES = ['Below 2 LPA', '2–5 LPA', '5–10 LPA', '10–20 LPA', '20–50 LPA', '50 LPA+', 'Prefer not to say'];

// ─── Carousel Slides ──────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: '💒',
    title: 'Find Your Perfect Life Partner',
    subtitle: 'Exclusively for the Nadar community. Connect with thousands of verified profiles.',
  },
  {
    icon: '🔐',
    title: 'Verified & Trusted Profiles',
    subtitle: 'Every profile is manually reviewed to ensure authenticity and sincerity.',
  },
  {
    icon: '💍',
    title: 'Rooted in Community Values',
    subtitle: 'Shared traditions, culture, and family values at the heart of every match.',
  },
  {
    icon: '🎉',
    title: 'Registration is Always Free',
    subtitle: 'Create your profile at no cost and take the first step toward your happily ever after.',
  },
];

// ─── Steps Config ─────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Account', desc: 'Your login details' },
  { label: 'Basic Info', desc: 'About you' },
  { label: 'Details', desc: 'Background & location' },
  { label: 'Verify', desc: 'Confirm your email' },
];

// ─── Form Types ───────────────────────────────────────────────────────────────

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: string;
  age: string;
  religion: string;
  denomination: string;
  caste: string;
  motherTongue: string;
  education: string;
  occupation: string;
  annualIncome: string;
  city: string;
  state: string;
  country: string;
  bio: string;
  otp: string;
};

const initialValues: FormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  gender: '',
  age: '',
  religion: '',
  denomination: '',
  caste: '',
  motherTongue: '',
  education: '',
  occupation: '',
  annualIncome: '',
  city: '',
  state: '',
  country: 'India',
  bio: '',
  otp: '',
};

// ─── Validation Schemas ───────────────────────────────────────────────────────

const schemas: Yup.ObjectSchema<Partial<FormValues>>[] = [
  // Step 1
  Yup.object({
    firstName: Yup.string().min(2, 'Minimum 2 characters').required('First name is required'),
    lastName: Yup.string().min(2, 'Minimum 2 characters').required('Last name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords do not match')
      .required('Please confirm your password'),
  }),
  // Step 2
  Yup.object({
    gender: Yup.string().oneOf([...GENDERS], 'Select a gender').required('Gender is required'),
    age: Yup.number()
      .typeError('Enter a valid age')
      .min(18, 'Must be at least 18')
      .max(80, 'Maximum age is 80')
      .required('Age is required'),
    religion: Yup.string().required('Religion is required'),
    motherTongue: Yup.string().required('Mother tongue is required'),
  }),
  // Step 3 — all optional
  Yup.object({
    bio: Yup.string().max(500, 'Maximum 500 characters'),
  }),
  // Step 4 — OTP
  Yup.object({}),
];

const STEP_FIELDS: (keyof FormValues)[][] = [
  ['firstName', 'lastName', 'email', 'password', 'confirmPassword'],
  ['gender', 'age', 'religion', 'motherTongue'],
  ['bio'],
  [],
];

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step
                  ? 'bg-primary text-white'
                  : i === step
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-surface border-2 border-border text-text-muted'
              }`}
            >
              {i < step ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-xs mt-1 font-medium whitespace-nowrap ${
                i === step ? 'text-primary' : i < step ? 'text-text-secondary' : 'text-text-muted'
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`h-0.5 flex-1 mx-2 -mt-5 rounded transition-all duration-500 ${
                i < step ? 'bg-primary' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Account Details ─────────────────────────────────────────────────

function Step1({ f }: { f: FormikProps<FormValues> }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First Name" error={f.errors.firstName} touched={f.touched.firstName} required>
          <TextInput
            name="firstName"
            value={f.values.firstName}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            placeholder="Arjun"
            error={f.errors.firstName}
            touched={f.touched.firstName}
          />
        </Field>
        <Field label="Last Name" error={f.errors.lastName} touched={f.touched.lastName} required>
          <TextInput
            name="lastName"
            value={f.values.lastName}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            placeholder="Nadar"
            error={f.errors.lastName}
            touched={f.touched.lastName}
          />
        </Field>
      </div>

      <Field label="Email Address" error={f.errors.email} touched={f.touched.email} required>
        <TextInput
          name="email"
          type="email"
          value={f.values.email}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          placeholder="arjun@example.com"
          error={f.errors.email}
          touched={f.touched.email}
        />
      </Field>

      <Field
        label="Password"
        error={f.errors.password}
        touched={f.touched.password}
        hint="At least 8 characters"
        required
      >
        <TextInput
          name="password"
          type="password"
          value={f.values.password}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          placeholder="••••••••"
          error={f.errors.password}
          touched={f.touched.password}
        />
      </Field>

      <Field label="Confirm Password" error={f.errors.confirmPassword} touched={f.touched.confirmPassword} required>
        <TextInput
          name="confirmPassword"
          type="password"
          value={f.values.confirmPassword}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          placeholder="••••••••"
          error={f.errors.confirmPassword}
          touched={f.touched.confirmPassword}
        />
      </Field>
    </>
  );
}

// ─── Step 2: Basic Profile ────────────────────────────────────────────────────

function Step2({ f }: { f: FormikProps<FormValues> }) {
  const lookups = useLookups();

  const denominationOptions = lookupOptions(
    lookups.denominations.filter((d) => d.religionId === Number(f.values.religion))
  );

  const handleReligionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    f.handleChange(e);
    // Clear denomination when religion changes
    f.setFieldValue('denomination', '');
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Gender" error={f.errors.gender} touched={f.touched.gender} required>
          <SelectInput
            name="gender"
            value={f.values.gender}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            error={f.errors.gender}
            touched={f.touched.gender}
            placeholder="Select gender"
            options={GENDERS.map((g) => ({ value: g, label: g.charAt(0) + g.slice(1).toLowerCase() }))}
          />
        </Field>

        <Field label="Age" error={f.errors.age} touched={f.touched.age} required>
          <TextInput
            name="age"
            type="number"
            min={18}
            max={80}
            value={f.values.age}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            placeholder="25"
            error={f.errors.age}
            touched={f.touched.age}
          />
        </Field>
      </div>

      <Field label="Religion" error={f.errors.religion} touched={f.touched.religion} required>
        <SelectInput
          name="religion"
          value={f.values.religion}
          onChange={handleReligionChange}
          onBlur={f.handleBlur}
          error={f.errors.religion}
          touched={f.touched.religion}
          placeholder="Select religion"
          options={lookupOptions(lookups.religions)}
        />
      </Field>

      {denominationOptions.length > 0 && (
        <Field label="Denomination" error={f.errors.denomination} touched={f.touched.denomination}>
          <SelectInput
            name="denomination"
            value={f.values.denomination}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            error={f.errors.denomination}
            touched={f.touched.denomination}
            placeholder="Select denomination"
            options={denominationOptions}
          />
        </Field>
      )}

      <Field label="Mother Tongue" error={f.errors.motherTongue} touched={f.touched.motherTongue} required>
        <SelectInput
          name="motherTongue"
          value={f.values.motherTongue}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          error={f.errors.motherTongue}
          touched={f.touched.motherTongue}
          placeholder="Select language"
          options={lookupOptions(lookups.languages)}
        />
      </Field>

      <Field label="Caste" error={f.errors.caste} touched={f.touched.caste} hint="Optional">
        <TextInput
          name="caste"
          value={f.values.caste}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          placeholder="e.g. Saiva Vellalar"
          error={f.errors.caste}
          touched={f.touched.caste}
        />
      </Field>
    </>
  );
}

// ─── Step 3: More Details ─────────────────────────────────────────────────────

function Step3({ f }: { f: FormikProps<FormValues> }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Education" error={f.errors.education} touched={f.touched.education}>
          <SelectInput
            name="education"
            value={f.values.education}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            error={f.errors.education}
            touched={f.touched.education}
            placeholder="Select"
            options={EDUCATIONS.map((e) => ({ value: e, label: e }))}
          />
        </Field>

        <Field label="Annual Income" error={f.errors.annualIncome} touched={f.touched.annualIncome}>
          <SelectInput
            name="annualIncome"
            value={f.values.annualIncome}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            error={f.errors.annualIncome}
            touched={f.touched.annualIncome}
            placeholder="Select"
            options={ANNUAL_INCOMES.map((i) => ({ value: i, label: i }))}
          />
        </Field>
      </div>

      <Field label="Occupation" error={f.errors.occupation} touched={f.touched.occupation}>
        <TextInput
          name="occupation"
          value={f.values.occupation}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          placeholder="e.g. Software Engineer"
          error={f.errors.occupation}
          touched={f.touched.occupation}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="City" error={f.errors.city} touched={f.touched.city}>
          <TextInput
            name="city"
            value={f.values.city}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            placeholder="Chennai"
            error={f.errors.city}
            touched={f.touched.city}
          />
        </Field>
        <Field label="State" error={f.errors.state} touched={f.touched.state}>
          <TextInput
            name="state"
            value={f.values.state}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            placeholder="Tamil Nadu"
            error={f.errors.state}
            touched={f.touched.state}
          />
        </Field>
      </div>

      <Field label="Country" error={f.errors.country} touched={f.touched.country}>
        <TextInput
          name="country"
          value={f.values.country}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          placeholder="India"
          error={f.errors.country}
          touched={f.touched.country}
        />
      </Field>

      <Field
        label="About Yourself"
        error={f.errors.bio}
        touched={f.touched.bio}
        hint={`${f.values.bio.length}/500 — Tell potential matches a little about yourself`}
      >
        <Textarea
          name="bio"
          value={f.values.bio}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          rows={4}
          maxLength={500}
          placeholder="Share your interests, values, and what you're looking for in a partner..."
          error={f.errors.bio}
          touched={f.touched.bio}
        />
      </Field>
    </>
  );
}

// ─── Step 4: OTP Verification ─────────────────────────────────────────────────

function Step4({
  email,
  otpSent,
  onSendOtp,
  otp,
  onOtpChange,
}: {
  email: string;
  otpSent: boolean;
  onSendOtp: () => void;
  otp: string;
  onOtpChange: (val: string) => void;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const chars = otp.padEnd(6, ' ').split('');
    chars[i] = val || ' ';
    const next = chars.join('').trimEnd();
    onOtpChange(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onOtpChange(pasted);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-4xl">
        📱
      </div>

      <div>
        <h3 className="text-lg font-bold text-text">Verify Your Email</h3>
        <p className="text-text-secondary text-sm mt-1 max-w-xs">
          We'll send a 6-digit verification code to{' '}
          <span className="font-semibold text-primary">{email || 'your email address'}</span>
        </p>
      </div>

      {!otpSent ? (
        <Button variant="primary" size="lg" type="button" onClick={onSendOtp}>
          Send Verification Code
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Code sent to {email}
          </p>

          <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[i] ?? ''}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-lg outline-none transition-all ${
                  otp[i]
                    ? 'border-primary bg-secondary text-primary'
                    : 'border-border bg-white text-text focus:border-primary focus:ring-2 focus:ring-primary/15'
                }`}
              />
            ))}
          </div>

          <Button variant="ghost" size="sm" type="button" onClick={onSendOtp}>
            Resend code
          </Button>

          <p className="text-xs text-text-muted mt-1">
            For demo purposes, enter any 6-digit code to continue.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Carousel ────────────────────────────────────────────────────────────────

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

      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center px-12">
        <div className="text-center text-white max-w-sm">
          <div
            key={slide}
            className="transition-all duration-700"
            style={{ animation: 'fadeIn 0.6s ease' }}
          >
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

      {/* Bottom stat bar */}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      router.replace('/dashboard');
    }
  }, [router]);
  const toast = useToast();
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik<FormValues>({
    initialValues,
    onSubmit: () => {},
    validateOnChange: false,
    validateOnBlur: true,
  });

  const handleNext = async () => {
    const fields = STEP_FIELDS[step];

    const touched = fields.reduce<Partial<Record<keyof FormValues, boolean>>>(
      (acc, f) => ({ ...acc, [f]: true }),
      {}
    );
    formik.setTouched({ ...formik.touched, ...touched }, false);

    try {
      await schemas[step].validate(formik.values, { abortEarly: false });
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        const errors = err.inner.reduce<Partial<Record<keyof FormValues, string>>>(
          (acc, e) => ({ ...acc, [e.path as keyof FormValues]: e.message }),
          {}
        );
        formik.setErrors(errors);
      }
      return;
    }

    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    // Final submit
    setIsSubmitting(true);
    try {
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formik.values.firstName} ${formik.values.lastName}`,
          email: formik.values.email,
          password: formik.values.password,
        }),
      });

      if (!regRes.ok) {
        const err = await regRes.json();
        throw new Error(err.message ?? 'Registration failed. Please try again.');
      }

      const { access_token } = await regRes.json();
      localStorage.setItem('access_token', access_token);

      const { firstName, lastName, email, password, confirmPassword, otp, ...profileFields } = formik.values;
      const profile: Record<string, unknown> = {};
      if (profileFields.gender) profile.gender = profileFields.gender;
      if (profileFields.age) profile.age = Number(profileFields.age);
      if (profileFields.religion) profile.religionId = Number(profileFields.religion);
      if (profileFields.denomination) profile.denominationId = Number(profileFields.denomination);
      if (profileFields.caste) profile.caste = profileFields.caste;
      if (profileFields.motherTongue) profile.motherTongueId = Number(profileFields.motherTongue);
      if (profileFields.education) profile.education = profileFields.education;
      if (profileFields.occupation) profile.occupation = profileFields.occupation;
      if (profileFields.annualIncome) profile.annualIncome = profileFields.annualIncome;
      if (profileFields.city) profile.city = profileFields.city;
      if (profileFields.state) profile.state = profileFields.state;
      if (profileFields.country) profile.country = profileFields.country;
      if (profileFields.bio) profile.bio = profileFields.bio;

      await fetch(`${API_URL}/profiles/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(profile),
      });

      router.push('/dashboard');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitle = ['Create your account', 'Tell us about yourself', 'A little more about you', 'Almost there!'];
  const stepSubtitle = [
    'Your login details — keep your password safe.',
    'Basic details to help find the right match.',
    'Help us personalise your experience.',
    'Verify your email to complete registration.',
  ];

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="w-5/12 flex-none sticky top-0 h-screen">
        <Carousel />
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-background min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-none">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="text-accent font-bold text-xl">✦</span>
            <span className="font-semibold text-sm text-text">Angel Nadar Matrimony</span>
          </Link>
          <div className="hidden lg:block" />
          <p className="text-sm text-text-secondary">
            Already registered?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>

        <div className="flex-1 max-w-lg w-full mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 bg-secondary text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-primary/20">
              🎉 Registration is 100% Free
            </div>
            <h1 className="text-2xl font-bold text-text">{stepTitle[step]}</h1>
            <p className="text-text-secondary text-sm mt-1">{stepSubtitle[step]}</p>
          </div>

          {/* Stepper */}
          <Stepper step={step} />

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
            className="flex flex-col gap-4"
            noValidate
          >
            {step === 0 && <Step1 f={formik} />}
            {step === 1 && <Step2 f={formik} />}
            {step === 2 && <Step3 f={formik} />}
            {step === 3 && (
              <Step4
                email={formik.values.email}
                otpSent={otpSent}
                onSendOtp={() => setOtpSent(true)}
                otp={formik.values.otp}
                onOtpChange={(val) => formik.setFieldValue('otp', val)}
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-2">
              {step > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setStep((s) => s - 1)}
                >
                  ← Back
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Creating account…'
                  : step < STEPS.length - 1
                  ? 'Continue →'
                  : '✓ Complete Registration'}
              </Button>
            </div>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-text-muted mt-8 leading-relaxed">
            By registering, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
