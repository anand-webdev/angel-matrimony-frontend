'use client';

import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/Button';
import { Field, TextInput, SelectInput, Textarea } from '../../../components/Input';
import { useToast } from '../../../components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const GENDERS        = ['MALE', 'FEMALE'] as const;
const RELIGIONS      = ['HINDU', 'CHRISTIAN'] as const;
const DENOMINATIONS  = [
  'BORN_AGAIN', 'BRETHREN', 'CHURCH_OF_SOUTH_INDIA', 'EVANGELIST', 'JACOBITE',
  'KNANAYA', 'KNANAYA_CATHOLIC', 'KNANAYA_JACOBITE', 'LATIN_CATHOLIC', 'MALANKARA',
  'MARTHOMA', 'PENTECOST', 'ROMAN_CATHOLIC', 'SYRIAN_CATHOLIC', 'SYRIAN_JACOBITE',
  'SYRIAN_ORTHODOX', 'SYRO_MALABAR', 'CHURCH_OF_NORTH_INDIA', 'ONLY_JESUS',
  'UNSPECIFIED', 'DO_NOT_WISH_TO_SPECIFY', 'OTHERS',
] as const;
const LANGUAGES      = [
  'ASSAMESE', 'BENGALI', 'BODO', 'DOGRI', 'GUJARATI', 'HINDI', 'KANNADA',
  'KASHMIRI', 'KONKANI', 'MAITHILI', 'MALAYALAM', 'MANIPURI', 'MARATHI',
  'NEPALI', 'ODIA', 'PUNJABI', 'SANSKRIT', 'SANTALI', 'SINDHI', 'TAMIL',
  'TELUGU', 'URDU', 'AWADHI', 'BHOJPURI', 'CHHATTISGARHI', 'HARYANVI',
  'RAJASTHANI', 'TULU', 'KODAVA', 'BADAGA', 'BEARY', 'LAMBADI', 'SOURASHTRA',
  'BHILI', 'GONDI', 'KURUKH', 'MUNDARI', 'KHASI', 'MIZO', 'IRULA', 'TODA',
  'KOTA', 'OTHERS',
] as const;
const EDUCATIONS     = ["High School", "Diploma", "Bachelor's", "Master's", "PhD", "Other"];
const ANNUAL_INCOMES = ['Below 2 LPA', '2–5 LPA', '5–10 LPA', '10–20 LPA', '20–50 LPA', '50 LPA+', 'Prefer not to say'];

const fmt = (s: string) =>
  s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ─── Form Types ───────────────────────────────────────────────────────────────

type FormValues = {
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
};

const schema = Yup.object({
  gender:      Yup.string().oneOf([...GENDERS]).required('Gender is required'),
  age:         Yup.number().typeError('Enter a valid age').min(18).max(80).required('Age is required'),
  religion:    Yup.string().oneOf([...RELIGIONS]).required('Religion is required'),
  motherTongue: Yup.string().required('Mother tongue is required'),
  bio:         Yup.string().max(500, 'Maximum 500 characters'),
});

// ─── Create Profile Page ──────────────────────────────────────────────────────

export default function CreateProfilePage() {
  const router = useRouter();
  const toast  = useToast();

  const formik = useFormik<FormValues>({
    initialValues: {
      gender: '', age: '', religion: '', denomination: '',
      caste: '', motherTongue: '', education: '', occupation: '',
      annualIncome: '', city: '', state: '', country: 'India', bio: '',
    },
    validationSchema: schema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      const token = localStorage.getItem('access_token');
      if (!token) { router.replace('/login'); return; }

      const body: Record<string, unknown> = {};
      if (values.gender)       body.gender       = values.gender;
      if (values.age)          body.age           = Number(values.age);
      if (values.religion)     body.religion      = values.religion;
      if (values.denomination) body.denomination  = values.denomination;
      if (values.caste)        body.caste         = values.caste;
      if (values.motherTongue) body.motherTongue  = values.motherTongue;
      if (values.education)    body.education     = values.education;
      if (values.occupation)   body.occupation    = values.occupation;
      if (values.annualIncome) body.annualIncome  = values.annualIncome;
      if (values.city)         body.city          = values.city;
      if (values.state)        body.state         = values.state;
      if (values.country)      body.country       = values.country;
      if (values.bio)          body.bio           = values.bio;

      try {
        const res = await fetch(`${API_URL}/profiles/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message ?? 'Failed to save profile.');
        }

        toast.success('Profile saved successfully!');
        router.push('/dashboard/profile');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Something went wrong.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const f = formik;

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-7">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-text-secondary hover:text-primary flex items-center gap-1 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-text">Create Your Profile</h1>
        <p className="text-text-secondary text-sm mt-1">
          Fill in your details to help potential matches find you.
        </p>
      </div>

      <form onSubmit={f.handleSubmit} noValidate className="flex flex-col gap-6">

        {/* ── Personal ── */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Personal Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Gender" error={f.errors.gender} touched={f.touched.gender} required>
              <SelectInput
                name="gender" value={f.values.gender}
                onChange={f.handleChange} onBlur={f.handleBlur}
                error={f.errors.gender} touched={f.touched.gender}
                placeholder="Select gender"
                options={GENDERS.map((g) => ({ value: g, label: fmt(g) }))}
              />
            </Field>

            <Field label="Age" error={f.errors.age} touched={f.touched.age} required>
              <TextInput
                name="age" type="number" min={18} max={80}
                value={f.values.age} onChange={f.handleChange} onBlur={f.handleBlur}
                placeholder="25" error={f.errors.age} touched={f.touched.age}
              />
            </Field>
          </div>

          <Field label="Religion" error={f.errors.religion} touched={f.touched.religion} required>
            <SelectInput
              name="religion" value={f.values.religion}
              onChange={f.handleChange} onBlur={f.handleBlur}
              error={f.errors.religion} touched={f.touched.religion}
              placeholder="Select religion"
              options={RELIGIONS.map((r) => ({ value: r, label: fmt(r) }))}
            />
          </Field>

          {f.values.religion === 'CHRISTIAN' && (
            <Field label="Denomination" error={f.errors.denomination} touched={f.touched.denomination}>
              <SelectInput
                name="denomination" value={f.values.denomination}
                onChange={f.handleChange} onBlur={f.handleBlur}
                error={f.errors.denomination} touched={f.touched.denomination}
                placeholder="Select denomination"
                options={DENOMINATIONS.map((d) => ({ value: d, label: fmt(d) }))}
              />
            </Field>
          )}

          <Field label="Mother Tongue" error={f.errors.motherTongue} touched={f.touched.motherTongue} required>
            <SelectInput
              name="motherTongue" value={f.values.motherTongue}
              onChange={f.handleChange} onBlur={f.handleBlur}
              error={f.errors.motherTongue} touched={f.touched.motherTongue}
              placeholder="Select language"
              options={LANGUAGES.map((l) => ({ value: l, label: fmt(l) }))}
            />
          </Field>

          <Field label="Caste" error={f.errors.caste} touched={f.touched.caste} hint="Optional">
            <TextInput
              name="caste" value={f.values.caste}
              onChange={f.handleChange} onBlur={f.handleBlur}
              placeholder="e.g. Saiva Vellalar"
              error={f.errors.caste} touched={f.touched.caste}
            />
          </Field>
        </div>

        {/* ── Career & Education ── */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Career & Education</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Education" error={f.errors.education} touched={f.touched.education}>
              <SelectInput
                name="education" value={f.values.education}
                onChange={f.handleChange} onBlur={f.handleBlur}
                error={f.errors.education} touched={f.touched.education}
                placeholder="Select"
                options={EDUCATIONS.map((e) => ({ value: e, label: e }))}
              />
            </Field>
            <Field label="Annual Income" error={f.errors.annualIncome} touched={f.touched.annualIncome}>
              <SelectInput
                name="annualIncome" value={f.values.annualIncome}
                onChange={f.handleChange} onBlur={f.handleBlur}
                error={f.errors.annualIncome} touched={f.touched.annualIncome}
                placeholder="Select"
                options={ANNUAL_INCOMES.map((i) => ({ value: i, label: i }))}
              />
            </Field>
          </div>

          <Field label="Occupation" error={f.errors.occupation} touched={f.touched.occupation}>
            <TextInput
              name="occupation" value={f.values.occupation}
              onChange={f.handleChange} onBlur={f.handleBlur}
              placeholder="e.g. Software Engineer"
              error={f.errors.occupation} touched={f.touched.occupation}
            />
          </Field>
        </div>

        {/* ── Location ── */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Location</h2>

          <div className="grid grid-cols-2 gap-4">
            <Field label="City" error={f.errors.city} touched={f.touched.city}>
              <TextInput
                name="city" value={f.values.city}
                onChange={f.handleChange} onBlur={f.handleBlur}
                placeholder="Chennai" error={f.errors.city} touched={f.touched.city}
              />
            </Field>
            <Field label="State" error={f.errors.state} touched={f.touched.state}>
              <TextInput
                name="state" value={f.values.state}
                onChange={f.handleChange} onBlur={f.handleBlur}
                placeholder="Tamil Nadu" error={f.errors.state} touched={f.touched.state}
              />
            </Field>
          </div>

          <Field label="Country" error={f.errors.country} touched={f.touched.country}>
            <TextInput
              name="country" value={f.values.country}
              onChange={f.handleChange} onBlur={f.handleBlur}
              placeholder="India" error={f.errors.country} touched={f.touched.country}
            />
          </Field>
        </div>

        {/* ── About ── */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">About You</h2>
          <Field
            label="Bio"
            error={f.errors.bio}
            touched={f.touched.bio}
            hint={`${f.values.bio.length}/500 — Tell potential matches about yourself`}
          >
            <Textarea
              name="bio" value={f.values.bio}
              onChange={f.handleChange} onBlur={f.handleBlur}
              rows={4} maxLength={500}
              placeholder="Share your interests, values, and what you're looking for in a partner..."
              error={f.errors.bio} touched={f.touched.bio}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Button type="button" variant="secondary" fullWidth onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth disabled={f.isSubmitting}>
            {f.isSubmitting ? 'Saving…' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
}
