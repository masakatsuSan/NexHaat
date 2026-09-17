import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api';
import { signupSchema, type SignupFormData } from '@/utils/validators';
import { Button, Input, Select } from '@/components/ui';
import { Phone, Shield, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { STATES } from '@/utils/constants';

export function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SignupFormData>>({});

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      phone: '',
      district: '',
      state: '',
      role: 'FARMER',
      otp: '',
    },
  });

  const watchedPhone = watch('phone');

  const onSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    const phoneValue = watchedPhone;
    if (!phoneValue) return;

    // Validate other fields first
    const name = watch('name');
    const district = watch('district');
    const role = watch('role');

    if (!name || !district || !role) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await authApi.sendOtp(phoneValue);
      if (response.success) {
        setSentOtp(response.otp || null);
        setFormData({
          name: watch('name'),
          phone: phoneValue,
          district: watch('district'),
          state: watch('state'),
          role: watch('role'),
        });
        setStep('otp');
        toast.success('OTP sent successfully');
        if (response.otp) {
          toast.success(`Demo OTP: ${response.otp}`, { duration: 10000, icon: '🔢' });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      toast.error(message);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    const submitData = step === 'otp' ? { ...formData, otp: data.otp } : data;

    try {
      const response = await authApi.verifyOtp({
        phone: submitData.phone!,
        otp: submitData.otp!,
        name: submitData.name,
        role: submitData.role,
        district: submitData.district,
        state: submitData.state,
      });

      if (response.success && response.token && response.user) {
        login(response.user, response.token);
        toast.success(`Welcome to NexHaat, ${response.user.name}!`);
        navigate(submitData.role === 'BUYER' ? '/buyer/requirements' : '/dashboard', { replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
    }
  };

  const stateOptions = STATES.map((state) => ({ value: state, label: state }));

  return (
    <main className="page">
      <header className="mb-8">
        <Link to="/" className="brand text-2xl font-extrabold tracking-wide text-green" aria-label="NexHaat Home">
          NEXHAAT
        </Link>
      </header>

      <section className="card">
        <p className="eyebrow mb-2">FARMER REGISTRATION</p>
        <h1 className="text-2xl font-bold text-ink mb-6">Create your account.</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full name"
            placeholder="e.g. Ramesh Kumar"
            {...register('name')}
            error={errors.name?.message}
            disabled={step === 'otp'}
            value={step === 'otp' ? formData.name : undefined}
          />

          <Input
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            placeholder="9876543210"
            maxLength={10}
            {...register('phone')}
            error={errors.phone?.message}
            disabled={step === 'otp'}
            value={step === 'otp' ? formData.phone : undefined}
          />

          <Input
            label="District"
            placeholder="e.g. Pune"
            {...register('district')}
            error={errors.district?.message}
            disabled={step === 'otp'}
            value={step === 'otp' ? formData.district : undefined}
          />

          <Select
            label="State"
            placeholder="Select state"
            options={stateOptions}
            {...register('state')}
            error={errors.state?.message}
            disabled={step === 'otp'}
            value={step === 'otp' ? formData.state : undefined}
          />

          <div className="space-y-2">
            <label className="label">Role</label>
            <div className="flex gap-4">
              {(['FARMER', 'BUYER'] as const).map((role) => (
                <label
                  key={role}
                  className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border-2 transition-colors ${
                    watch('role') === role
                      ? 'border-green bg-green/5 text-green'
                      : 'border-line text-gray-600 hover:border-green/50'
                  }`}
                >
                  <input
                    type="radio"
                    value={role}
                    {...register('role')}
                    className="sr-only"
                    disabled={step === 'otp'}
                  />
                  <span className="font-medium capitalize">{role.toLowerCase()}</span>
                </label>
              ))}
            </div>
            {errors.role && <p className="field-error">{errors.role.message}</p>}
          </div>

          {step === 'form' ? (
            <Button type="button" onClick={onSendOtp} className="w-full" size="lg">
              <Phone className="h-5 w-5" />
              Send OTP
            </Button>
          ) : (
            <>
              <Input
                label="OTP"
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                {...register('otp')}
                error={errors.otp?.message}
                autoComplete="one-time-code"
              />
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex items-center gap-1 text-green">
                  <CheckCircle className="h-4 w-4" />
                  Demo OTP: <strong>{sentOtp || 'Check console'}</strong>
                </span>
              </div>
              <Button type="submit" className="w-full" size="lg">
                <Shield className="h-5 w-5" />
                Register
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setStep('form'); reset(); setSentOtp(null); }} className="w-full">
                Change details
              </Button>
            </>
          )}

          <p className="text-center text-sm text-gray-600 mt-4">
            Already have an account? <Link to="/login" className="text-green font-medium hover:underline">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}