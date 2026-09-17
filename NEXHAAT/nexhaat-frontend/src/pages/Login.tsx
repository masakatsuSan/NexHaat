import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/api';
import { loginSchema, type LoginFormData } from '@/utils/validators';
import { Button, Input } from '@/components/ui';
import { Phone, Lock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [sentOtp, setSentOtp] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', otp: '' },
  });

  const watchedPhone = watch('phone');

  const onSendOtp = async (e: React.MouseEvent) => {
    e.preventDefault();
    const phoneValue = watchedPhone;
    if (!phoneValue) return;

    try {
      const response = await authApi.sendOtp(phoneValue);
      if (response.success) {
        setSentOtp(response.otp || null);
        setPhone(phoneValue);
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

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await authApi.verifyOtp({
        phone: data.phone,
        otp: data.otp,
      });
      if (response.success && response.token && response.user) {
        login(response.user, response.token);
        toast.success(`Welcome back, ${response.user.name}!`);
        navigate(from, { replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
    }
  };

  return (
    <main className="page">
      <header className="mb-8">
        <Link to="/" className="brand text-2xl font-extrabold tracking-wide text-green" aria-label="NexHaat Home">
          NEXHAAT
        </Link>
      </header>

      <section className="card">
        <p className="eyebrow mb-2">FARMER SIGN IN</p>
        <h1 className="text-2xl font-bold text-ink mb-6">Welcome back.</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Mobile number"
            type="tel"
            inputMode="numeric"
            placeholder="9876543210"
            maxLength={10}
            {...register('phone')}
            error={errors.phone?.message}
            disabled={step === 'otp'}
            value={step === 'otp' ? phone : watchedPhone}
          />

          {step === 'phone' ? (
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
                <Lock className="h-5 w-5" />
                Sign In
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setStep('phone'); reset(); setSentOtp(null); }} className="w-full">
                Change phone number
              </Button>
            </>
          )}

          <p className="text-center text-sm text-gray-600 mt-4">
            New to NexHaat? <Link to="/signup" className="text-green font-medium hover:underline">Register</Link>
          </p>
        </form>
      </section>
    </main>
  );
}