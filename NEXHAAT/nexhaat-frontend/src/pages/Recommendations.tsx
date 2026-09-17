import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { farmerApi, recommendationApi } from '@/api';
import { recommendationSchema, type RecommendationFormData } from '@/utils/validators';
import { CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Input, Select } from '@/components/ui';
import { Table } from '@/components/ui';
import { Badge } from '@/components/ui';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { MapPin, TrendingUp, Truck, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Lot {
  id: string;
  crop: string;
  location: string;
  quantity: number;
  quality: 'Grade-A' | 'Grade-B' | 'Grade-C';
  expected_price: number | null;
  harvest_date: string | null;
  status: 'LISTED' | 'SOLD';
  created_at: string;
}

interface RecommendationOption {
  mandi_name: string;
  district: string;
  modal_price_per_quintal: number;
  distance_km: number;
  gross_earnings: number;
  transport_cost: number;
  net_profit: number;
  is_viable: boolean;
}

interface RecommendationResponse {
  success: boolean;
  listing: {
    id: string;
    crop: string;
    quantity_quintals: number;
  };
  transport_rate_per_km: number;
  price_source: string;
  live_price_matches: number;
  best_mandi: string;
  net_profit_at_best_mandi: number;
  all_options: RecommendationOption[];
  smart_advisory: string;
}

export function Recommendations() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [lotsLoading, setLotsLoading] = useState(true);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecommendationFormData>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: {
      lot_id: '',
      latitude: 0,
      longitude: 0,
      max_distance_km: 200,
    },
  });

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const response = await farmerApi.getMyLots();
        setLots(response.lots);
      } catch (error) {
        toast.error('Failed to load your lots');
      } finally {
        setLotsLoading(false);
      }
    };
    fetchLots();
  }, []);

  const onSubmit = async (data: RecommendationFormData) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await recommendationApi.getRecommendations({
        lot_id: data.lot_id,
        latitude: data.latitude,
        longitude: data.longitude,
        max_distance_km: data.max_distance_km,
      });
      setResult(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get recommendations';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const lotOptions = lots.map(lot => ({
    value: lot.id,
    label: `${lot.crop} — ${lot.quantity} q ${lot.quality} @ ${lot.location}`,
  }));

  return (
    <div className="page wide">
      <header>
        <a href="/" className="brand text-xl font-extrabold tracking-wide text-green">NEXHAAT</a>
        <nav className="flex items-center gap-4">
          <a href="/dashboard" className="font-medium text-gray-600 hover:text-green">My Farm</a>
          <a href="/market" className="font-medium text-gray-600 hover:text-green">Market Prices</a>
          <a href="/recommend" className="font-medium text-green">Best Mandi</a>
          <a href="/buyer-requirements" className="font-medium text-gray-600 hover:text-green">Buyer Requirements</a>
          <a href="/profile" className="font-medium text-gray-600 hover:text-green">Profile</a>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-green hover:underline">Sign out</button>
        </nav>
      </header>

      <p className="eyebrow mb-2">MANDI RECOMMENDATION</p>
      <h1 className="text-3xl font-bold text-ink mb-6">Find the Best Mandi for Your Produce</h1>

      <section className="card mb-8">
        <form onSubmit={handleSubmit(onSubmit as (data: RecommendationFormData) => Promise<void>)} className="space-y-6">
          <div>
            <p className="eyebrow mb-2">STEP 1</p>
            <h2 className="text-xl font-semibold text-ink mb-4">Select Your Lot</h2>
            <Select
              label="Your Lots"
              options={lotOptions}
              placeholder={lotsLoading ? 'Loading lots…' : lots.length === 0 ? 'No lots posted yet' : 'Select a lot'}
              {...register('lot_id')}
              error={errors.lot_id?.message}
              disabled={lotsLoading || lots.length === 0}
            />
            {lots.length === 0 && !lotsLoading && (
              <p className="text-sm text-gray-500 mt-2">
                <a href="/dashboard" className="text-green hover:underline">Post a lot first</a> to get mandi recommendations.
              </p>
            )}
          </div>

          <div>
            <p className="eyebrow mb-2">STEP 2</p>
            <h2 className="text-xl font-semibold text-ink mb-4">Your Location</h2>
            <p className="text-sm text-gray-500 mb-4">Get GPS coordinates from your phone or map.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Latitude"
                type="number"
                step="any"
                placeholder="e.g. 18.5204"
                {...register('latitude')}
                error={errors.latitude?.message}
              />
              <Input
                label="Longitude"
                type="number"
                step="any"
                placeholder="e.g. 73.8567"
                {...register('longitude')}
                error={errors.longitude?.message}
              />
              <Input
                label="Max Distance (km)"
                type="number"
                min="1"
                max="2000"
                placeholder="e.g. 200"
                {...register('max_distance_km')}
                error={errors.max_distance_km?.message}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" loading={loading} disabled={lots.length === 0}>
            <TrendingUp className="h-5 w-5" />
            Find Best Mandi
          </Button>
        </form>
      </section>

      {result && (
        <section className="card animate-fade-in">
          <CardHeader>
            <CardTitle>Recommendation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-green/5 rounded-lg border border-green/20">
              <h3 className="text-lg font-semibold text-ink mb-2">
                {result.listing.crop} — {formatNumber(result.listing.quantity_quintals)} quintals
              </h3>
              <p className="text-gray-600">
                <strong>Best:</strong> {result.best_mandi} · Net {formatCurrency(result.net_profit_at_best_mandi)} · {result.price_source}
              </p>
              <p className="text-sm text-gray-500 mt-2">{result.smart_advisory}</p>
            </div>

            {result.all_options.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 mx-auto text-warning mb-4" />
                <p className="text-gray-500">No viable mandis found within range.</p>
              </div>
            ) : (
              <Table<RecommendationOption>
                columns={[
                  { key: 'mandi_name', header: 'Mandi', render: (row) => (
                    <div>
                      <p className="font-medium text-ink">{row.mandi_name}</p>
                      <p className="text-sm text-gray-500">{row.district}</p>
                    </div>
                  )},
                  { key: 'modal_price_per_quintal', header: 'Modal Price (₹/q)', render: (row) => formatCurrency(row.modal_price_per_quintal) },
                  { key: 'distance_km', header: 'Distance (km)', render: (row) => (
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{formatNumber(row.distance_km)}</span>
                  )},
                  { key: 'gross_earnings', header: 'Gross Earnings (₹)', render: (row) => formatCurrency(row.gross_earnings) },
                  { key: 'transport_cost', header: 'Transport Cost (₹)', render: (row) => (
                    <span className="flex items-center gap-1"><Truck className="h-4 w-4" />{formatCurrency(row.transport_cost)}</span>
                  )},
                  { key: 'net_profit', header: 'Net Profit (₹)', render: (row) => (
                    <strong className={row.is_viable ? 'text-green' : 'text-red-600'}>
                      {formatCurrency(row.net_profit)}
                    </strong>
                  )},
                  { key: 'is_viable', header: 'Viable', render: (row) => (
                    <Badge variant={row.is_viable ? 'success' : 'danger'}>
                      {row.is_viable ? (
                        <> <CheckCircle className="h-3.5 w-3.5 mr-1" /> Viable </> 
                      ) : (
                        <> <AlertCircle className="h-3.5 w-3.5 mr-1" /> Not Viable </>
                      )}
                    </Badge>
                  )},
                ]}
                data={result.all_options}
                keyExtractor={(row) => `${row.mandi_name}-${row.district}`}
                rowClassName={(row) => row.is_viable ? '' : 'not-viable'}
                emptyMessage="No mandis found within range."
              />
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p><strong>Transport rate:</strong> ₹{result.transport_rate_per_km}/km</p>
              <p><strong>Live price matches:</strong> {result.live_price_matches}</p>
            </div>
          </CardContent>
        </section>
      )}
    </div>
  );
}