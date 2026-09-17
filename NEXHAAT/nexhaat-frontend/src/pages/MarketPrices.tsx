import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { marketApi } from '@/api';
import { cropSchema, stateSchema, districtSchema } from '@/utils/validators';
import { Button, Input } from '@/components/ui';
import { formatNumber, formatDate } from '@/utils/formatters';
import { CROPS, STATES } from '@/utils/constants';
import { Search, MapPin, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

interface FormData {
  crop: string;
  state: string;
  district: string;
}

const cropOptions = CROPS.map(crop => ({ value: crop, label: crop }));
const stateOptions = STATES.map(state => ({ value: state, label: state }));

export function MarketPrices() {
  const [results, setResults] = useState<{ mandi_name: string; district: string; state?: string; modal_price_per_quintal: number; min_price_per_quintal?: number; max_price_per_quintal?: number; price_date?: string }[]>([]);
  const [source, setSource] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(z.object({
      crop: cropSchema,
      state: stateSchema,
      district: districtSchema,
    })),
    defaultValues: { crop: '', state: '', district: '' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setResults([]);
    setSource('');
    setNotice(undefined);

    try {
      const response = await marketApi.getPrices(data.crop, data.state || undefined, data.district || undefined);
      if (response.success) {
        setResults(response.records || response.comparison || []);
        setSource(response.source);
        setIsLive(response.is_live);
        setNotice(response.notice);
if (!response.records?.length && !response.comparison?.length) {
          toast.success(`No mandi prices found for ${data.crop}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch prices';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page wide">
      <header>
        <a href="/" className="brand text-xl font-extrabold tracking-wide text-green">NEXHAAT</a>
        <nav className="flex items-center gap-4">
          <a href="/dashboard" className="font-medium text-gray-600 hover:text-green">My Farm</a>
          <a href="/market" className="font-medium text-green">Market Prices</a>
          <a href="/recommend" className="font-medium text-gray-600 hover:text-green">Best Mandi</a>
          <a href="/buyer-requirements" className="font-medium text-gray-600 hover:text-green">Buyer Requirements</a>
          <a href="/profile" className="font-medium text-gray-600 hover:text-green">Profile</a>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-green hover:underline">Sign out</button>
        </nav>
      </header>

      <p className="eyebrow mb-2">MARKET PRICES</p>
      <h1 className="text-3xl font-bold text-ink mb-6">Compare Mandi Prices</h1>

      <section className="card mb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
          <div className="md:flex-1">
            <Input
              label="Crop"
              placeholder="e.g. Tomato, Onion, Potato"
              list="crops"
              {...register('crop')}
              error={errors.crop?.message}
            />
            <datalist id="crops">
              {cropOptions.map(opt => <option key={opt.value} value={opt.value} />)}
            </datalist>
          </div>
          <div className="md:w-48">
            <Input
              label="State (optional)"
              placeholder="e.g. Maharashtra"
              list="states"
              {...register('state')}
            />
            <datalist id="states">
              {stateOptions.map(opt => <option key={opt.value} value={opt.value} />)}
            </datalist>
          </div>
          <div className="md:w-48">
            <Input
              label="District (optional)"
              placeholder="e.g. Pune"
              {...register('district')}
            />
          </div>
          <Button type="submit" size="lg" className="gap-2" loading={loading}>
            <Search className="h-5 w-5" />
            Compare Prices
          </Button>
        </form>
      </section>

      {source && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <IndianRupee className="h-4 w-4 text-green" />
          <span className="font-medium">{source}</span>
          {isLive && <span className="badge badge-success">Live</span>}
          {!isLive && <span className="badge badge-warning">Cached</span>}
          {notice && <span className="text-gray-500">({notice})</span>}
        </div>
      )}

      <section className="card">
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((record) => (
              <article key={`${record.mandi_name}-${record.district}-${record.price_date}`} className="border border-line rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-ink mb-1">{record.mandi_name}</h3>
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {record.district}{record.state && `, ${record.state}`}
                </p>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-green">₹{formatNumber(record.modal_price_per_quintal)}</span>
                  <span className="text-gray-500">/quintal</span>
                </div>
                {(record.min_price_per_quintal || record.max_price_per_quintal) && (
                  <p className="text-sm text-gray-500">
                    Range: ₹{formatNumber(record.min_price_per_quintal)} – ₹{formatNumber(record.max_price_per_quintal)}
                  </p>
                )}
                {record.price_date && (
                  <p className="text-xs text-gray-400 mt-2">As of {formatDate(record.price_date)}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Enter a crop above to compare mandi prices</p>
          </div>
        )}
      </section>
    </div>
  );
}