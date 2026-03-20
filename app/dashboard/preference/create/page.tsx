'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/Button';
import { Field, TextInput, SelectInput } from '../../../components/Input';
import { useToast } from '../../../components/Toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const RELIGIONS      = ['HINDU', 'CHRISTIAN'] as const;
const EDUCATIONS     = ["High School", "Diploma", "Bachelor's", "Master's", "PhD", "Other"];

const schema = Yup.object({
  minAge: Yup.number().typeError('Enter a valid age').min(18).max(80).required('Min age is required'),
  maxAge: Yup.number()
    .typeError('Enter a valid age')
    .min(18)
    .max(80)
    .required('Max age is required')
    .moreThan(Yup.ref('minAge'), 'Max age must be greater than min age'),
});

type FormValues = {
  minAge: string;
  maxAge: string;
  preferredCity: string;
  preferredState: string;
  preferredCountry: string;
  religion: string;
  subCaste: string;
  education: string;
  profession: string;
};

// ─── Create / Update Preference Page ─────────────────────────────────────────

export default function CreatePreferencePage() {
  const router = useRouter();
  const toast  = useToast();
  const [isEdit, setIsEdit] = useState(false);

  const formik = useFormik<FormValues>({
    initialValues: {
      minAge: '18', maxAge: '35',
      preferredCity: '', preferredState: '', preferredCountry: '',
      religion: '', subCaste: '', education: '', profession: '',
    },
    validationSchema: schema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      const token = localStorage.getItem('access_token');
      if (!token) { router.replace('/login'); return; }

      const body: Record<string, unknown> = {
        minAge: Number(values.minAge),
        maxAge: Number(values.maxAge),
      };
      if (values.preferredCity)    body.preferredCity    = values.preferredCity;
      if (values.preferredState)   body.preferredState   = values.preferredState;
      if (values.preferredCountry) body.preferredCountry = values.preferredCountry;
      if (values.religion)         body.religion         = values.religion;
      if (values.subCaste)         body.subCaste         = values.subCaste;
      if (values.education)        body.education        = values.education;
      if (values.profession)       body.profession       = values.profession;

      try {
        const res = await fetch(
          `${API_URL}/preferences${isEdit ? '/me' : ''}`,
          {
            method: isEdit ? 'PUT' : 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          },
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message ?? 'Failed to save preference.');
        }

        toast.success(isEdit ? 'Preference updated!' : 'Preference saved!');
        router.push('/dashboard/preference');
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Something went wrong.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Pre-fill form if preference already exists
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const controller = new AbortController();
    fetch(`${API_URL}/preferences/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then(async (res) => {
      if (res.ok) {
        const p = await res.json();
        setIsEdit(true);
        formik.setValues({
          minAge:           String(p.minAge),
          maxAge:           String(p.maxAge),
          preferredCity:    p.preferredCity    ?? '',
          preferredState:   p.preferredState   ?? '',
          preferredCountry: p.preferredCountry ?? '',
          religion:         p.religion         ?? '',
          subCaste:         p.subCaste         ?? '',
          education:        p.education        ?? '',
          profession:       p.profession       ?? '',
        });
      }
    }).catch((err) => {
      if (err.name !== 'AbortError') toast.error('Could not load existing preference.');
    });

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <h1 className="text-2xl font-bold text-text">
          {isEdit ? 'Update Preference' : 'Set My Preference'}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Tell us what you're looking for in a life partner.
        </p>
      </div>

      <form onSubmit={f.handleSubmit} noValidate className="flex flex-col gap-6">

        {/* ── Age Range ── */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
            Age Range <span className="text-primary">*</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Minimum Age" error={f.errors.minAge} touched={f.touched.minAge} required>
              <TextInput
                name="minAge" type="number" min={18} max={80}
                value={f.values.minAge} onChange={f.handleChange} onBlur={f.handleBlur}
                placeholder="18" error={f.errors.minAge} touched={f.touched.minAge}
              />
            </Field>
            <Field label="Maximum Age" error={f.errors.maxAge} touched={f.touched.maxAge} required>
              <TextInput
                name="maxAge" type="number" min={18} max={80}
                value={f.values.maxAge} onChange={f.handleChange} onBlur={f.handleBlur}
                placeholder="35" error={f.errors.maxAge} touched={f.touched.maxAge}
              />
            </Field>
          </div>
        </div>

        {/* ── Background ── */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Background</h2>
          <Field label="Preferred Religion" error={f.errors.religion} touched={f.touched.religion}>
            <SelectInput
              name="religion" value={f.values.religion}
              onChange={f.handleChange} onBlur={f.handleBlur}
              error={f.errors.religion} touched={f.touched.religion}
              placeholder="Any religion"
              options={RELIGIONS.map((r) => ({ value: r, label: r.charAt(0) + r.slice(1).toLowerCase() }))}
            />
          </Field>
          <Field label="Sub-Caste" error={f.errors.subCaste} touched={f.touched.subCaste} hint="Optional">
            <TextInput
              name="subCaste" value={f.values.subCaste}
              onChange={f.handleChange} onBlur={f.handleBlur}
              placeholder="e.g. Saiva Vellalar"
              error={f.errors.subCaste} touched={f.touched.subCaste}
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
                placeholder="Any"
                options={EDUCATIONS.map((e) => ({ value: e, label: e }))}
              />
            </Field>
            <Field label="Profession" error={f.errors.profession} touched={f.touched.profession}>
              <TextInput
                name="profession" value={f.values.profession}
                onChange={f.handleChange} onBlur={f.handleBlur}
                placeholder="e.g. Software Engineer"
                error={f.errors.profession} touched={f.touched.profession}
              />
            </Field>
          </div>
        </div>

        {/* ── Location ── */}
        <div className="bg-white rounded-xl border border-border p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Preferred Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" error={f.errors.preferredCity} touched={f.touched.preferredCity}>
              <TextInput
                name="preferredCity" value={f.values.preferredCity}
                onChange={f.handleChange} onBlur={f.handleBlur}
                placeholder="Chennai"
                error={f.errors.preferredCity} touched={f.touched.preferredCity}
              />
            </Field>
            <Field label="State" error={f.errors.preferredState} touched={f.touched.preferredState}>
              <TextInput
                name="preferredState" value={f.values.preferredState}
                onChange={f.handleChange} onBlur={f.handleBlur}
                placeholder="Tamil Nadu"
                error={f.errors.preferredState} touched={f.touched.preferredState}
              />
            </Field>
          </div>
          <Field label="Country" error={f.errors.preferredCountry} touched={f.touched.preferredCountry}>
            <TextInput
              name="preferredCountry" value={f.values.preferredCountry}
              onChange={f.handleChange} onBlur={f.handleBlur}
              placeholder="India"
              error={f.errors.preferredCountry} touched={f.touched.preferredCountry}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pb-8">
          <Button type="button" variant="secondary" fullWidth onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" fullWidth disabled={f.isSubmitting}>
            {f.isSubmitting ? 'Saving…' : isEdit ? 'Update Preference' : 'Save Preference'}
          </Button>
        </div>
      </form>
    </div>
  );
}
