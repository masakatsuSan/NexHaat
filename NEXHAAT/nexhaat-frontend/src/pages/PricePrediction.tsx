import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { marketApi } from '@/api';
import { cropSchema } from '@/utils/validators';
import { Button, Input, Select } from '@/components/ui';
import { Badge } from '@/components/ui';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { CROPS } from '@/utils/constants';
import { TrendingUp, TrendingDown, Minus, AlertCircle, Search, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export function PricePrediction() {
  const [result, setResult] = useState<{
    success: boolean;
    crop: string;
    signal: string;
    current_avg?: number;
    previous_avg?: number;
    change_pct?: number;
    data_points?: number;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ crop: string }>({
    resolver: zodResolver(z.object({ crop: cropSchema })),
    defaultValues: { crop: '' },
  });

  const onSubmit = async (data: { crop: string }) => {
    setLoading(true);
    setResult(null);
    try {
      const response = await marketApi.getPricePrediction(data.crop);
      setResult(response);
      if (response.success) {
        toast.success(`Trend signal: ${response.signal}`);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch price prediction';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const cropOptions = CROPS.map(crop => ({ value: crop, label: crop }));

  const getSignalIcon = () => {
    switch (result?.signal) {
      case 'trending up': return <TrendingUp className="h-8 w-8 text-green" />;
      case 'trending down': return <TrendingDown className="h-8 w-8 text-red-600" />;
      case 'stable': return <Minus className="h-8 w-8 text-gray-500" />;
      default: return <AlertCircle className="h-8 w-8 text-warning" />;
    }
  };

  const getSignalBadge = () => {
    if (!result) return null;
    switch (result.signal) {
      case 'trending up': return <Badge variant="success">Trending Up</Badge>;
      case 'trending down': return <Badge variant="danger">Trending Down</Badge>;
      case 'stable': return <Badge variant="neutral">Stable</Badge>;
      case 'insufficient data': return <Badge variant="warning">Insufficient Data</Badge>;
      default: return <Badge variant="info">{result.signal}</Badge>;
    }
  };

  return (
    <div className="page wide">
      <header>
        <a href="/" className="brand text-xl font-extrabold tracking-wide text-green">NEXHAAT</a>
        <nav className="flex items-center gap-4">
          <a href="/dashboard" className="font-medium text-gray-600 hover:text-green">My Farm</a>
          <a href="/market" className="font-medium text-gray-600 hover:text-green">Market Prices</a>
          <a href="/recommend" className="font-medium text-gray-600 hover:text-green">Best Mandi</a>
          <a href="/buyer-requirements" className="font-medium text-gray-600 hover:text-green">Buyer Requirements</a>
          <a href="/profile" className="font-medium text-gray-600 hover:text-green">Profile</a>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-green hover:underline">Sign out</button>
        </nav>
      </header>

      <p className="eyebrow mb-2">PRICE PREDICTION</p>
      <h1 className="text-3xl font-bold text-ink mb-6">Sell Now or Wait?</h1>

      <section className="card mb-8">
        <form onSubmit={handleSubmit(onSubmit as (data: { crop: string }) => Promise<void>)} className="space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
          <div className="md:flex-1">
            <Input
              label="Crop"
              placeholder="e.g. Tomato, Onion, Potato"
              list="prediction-crops"
              {...register('crop')}
              error={errors.crop?.message}
            />
            <datalist id="prediction-crops">
              {cropOptions.map(opt => <option key={opt.value} value={opt.value} />)}
            </datalist>
          </div>
          <Button type="submit" size="lg" className="gap-2" loading={loading}>
            <Search className="h-5 w-5" />
            Analyze Trend
          </Button>
        </form>
      </section>

      {result && (
        <section className="card animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            {getSignalIcon()}
            <div>
              <h2 className="text-xl font-bold text-ink">{result.crop} Price Trend</h2>
              {getSignalBadge()}
            </div>
          </div>

          {result.success ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="stat-card">
                <span className="stat-label">Previous Average</span>
                <strong className="stat-value">{formatCurrency(result.previous_avg)}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Current Average</span>
                <strong className="stat-value">{formatCurrency(result.current_avg)}</strong>
              </div>
              <div className="stat-card">
                <span className="stat-label">Change</span>
                <strong className={`stat-value ${result.change_pct && result.change_pct > 0 ? 'text-green' : result.change_pct && result.change_pct < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {result.change_pct && result.change_pct > 0 ? '+' : ''}{result.change_pct}%
                </strong>
              </div>
            </div>
          ) : null}

          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 mb-4">
            <p className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {result.message}
            </p>
          </div>

          {result.success && result.data_points !== undefined && (
            <p className="text-sm text-gray-500">Based on {result.data_points} historical price data point{result.data_points !== 1 ? 's' : ''}.</p>
          )}

          {result.success && (
            <div className="mt-6 p-4 bg-green/5 rounded-lg border border-green/20">
              <h3 className="font-semibold text-ink mb-2">Advisory</h3>
              {result.signal === 'trending up' ? (
                <p className="text-gray-600">Prices are rising. Consider <strong className="text-green">waiting</strong> to sell for a potentially better price. Monitor the market closely.</p>
              ) : result.signal === 'trending down' ? (
                <p className="text-gray-600">Prices are falling. Consider <strong className="text-green">selling now</strong> to lock in current value before further decline.</p>
              ) : (
                <p className="text-gray-600">Prices are relatively stable. You can <strong>sell now or wait</strong> without significant expected price change.</p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
