import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { farmerApi } from '@/api';
import { createLotSchema, type CreateLotFormData } from '@/utils/validators';
import { Button, Input, Select } from '@/components/ui';
import { CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Table } from '@/components/ui';
import { Badge } from '@/components/ui';
import { formatCurrency, formatNumber, getQualityBadgeVariant, getStatusBadgeVariant } from '@/utils/formatters';
import { QUALITY_GRADES, type QualityGradeOption } from '@/utils/constants';
import { Plus, Loader2, MapPin } from 'lucide-react';
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

interface DashboardData {
  summary: {
    total_lots: number;
    total_quantity_quintals: number;
  };
  lots: Lot[];
  user: {
    name: string;
  };
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateLotFormData>({
    resolver: zodResolver(createLotSchema),
    defaultValues: {
      crop: '',
      quantity: 0,
      quality: 'Grade-A',
      location: '',
      expected_price: 0,
    },
  });

  const fetchData = async () => {
    try {
      const [summaryRes, lotsRes, meRes] = await Promise.all([
        farmerApi.getSummary(),
        farmerApi.getMyLots(),
        fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('nexhaatToken')}` },
        }).then(r => r.json()),
      ]);

      setData({
        summary: summaryRes.summary,
        lots: lotsRes.lots,
        user: meRes.user,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load dashboard';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onCreateLot = async (formData: CreateLotFormData) => {
    setSubmitting(true);
    try {
      await farmerApi.createLot({
        crop: formData.crop,
        quantity: formData.quantity,
        quality: formData.quality,
        location: formData.location,
        expected_price: formData.expected_price || undefined,
        harvest_date: formData.harvest_date,
      });
      toast.success('Lot published successfully');
      reset();
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to publish lot';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page wide">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="page wide">
      <header>
        <a href="/" className="brand text-xl font-extrabold tracking-wide text-green">NEXHAAT</a>
        <nav className="flex items-center gap-4">
          <Link to="/dashboard" className="font-medium text-green">My Farm</Link>
          <Link to="/market" className="font-medium text-gray-600 hover:text-green">Market Prices</Link>
          <Link to="/recommend" className="font-medium text-gray-600 hover:text-green">Best Mandi</Link>
          <Link to="/buyer-requirements" className="font-medium text-gray-600 hover:text-green">Buyer Requirements</Link>
          <a href="/profile" className="font-medium text-gray-600 hover:text-green">Profile</a>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-green hover:underline">Sign out</button>
        </nav>
      </header>

      <p className="eyebrow mb-2">FARMER DASHBOARD</p>
      <h1 id="welcome" className="text-3xl font-bold text-ink mb-6">
        Hello, {data?.user.name || 'Farmer'}
      </h1>

      <div className="stats-grid mb-8">
        <article className="stat-card">
          <span className="stat-label">Active Lots</span>
          <strong className="stat-value">{data?.summary.total_lots || 0}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Total Quantity</span>
          <strong className="stat-value">{formatNumber(data?.summary.total_quantity_quintals || 0)} q</strong>
        </article>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Post a Lot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreateLot as (data: CreateLotFormData) => Promise<void>)} className="space-y-4">
              <Input label="Crop" placeholder="e.g. Onion" {...register('crop')} error={errors.crop?.message} />
              <Input label="Quantity (quintals)" type="number" step="0.1" placeholder="e.g. 50" {...register('quantity')} error={errors.quantity?.message} />
              <Select
                label="Quality"
                options={QUALITY_GRADES as unknown as readonly QualityGradeOption[]}
                {...register('quality')}
                error={errors.quality?.message}
              />
              <Input label="Location" placeholder="Village or mandi" {...register('location')} error={errors.location?.message} />
              <Input label="Expected price / quintal (optional)" type="number" step="1" min="0" placeholder="e.g. 2500" {...register('expected_price')} error={errors.expected_price?.message} />
              <Button type="submit" className="w-full" size="lg" loading={submitting}>
                Publish Lot
              </Button>
            </form>
          </CardContent>
        </section>

        <section className="card">
          <CardHeader>
            <CardTitle>My Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.lots.length ? (
              <Table<Lot>
                columns={[
                  { key: 'crop', header: 'Crop' },
                  { key: 'quantity', header: 'Qty (q)', render: (row) => formatNumber(row.quantity) },
                  { key: 'quality', header: 'Quality', render: (row) => <Badge variant={getQualityBadgeVariant(row.quality)}>{row.quality}</Badge> },
                  { key: 'location', header: 'Location' },
                  { key: 'expected_price', header: 'Exp. Price', render: (row) => formatCurrency(row.expected_price) },
                  { key: 'status', header: 'Status', render: (row) => <Badge variant={getStatusBadgeVariant(row.status)}>{row.status}</Badge> },
                  { key: 'actions', header: '', render: (row) => (
                    <div className="flex items-center gap-2">
                      <Link to={`/recommend?lot=${row.id}`} className="text-green hover:underline text-sm" title="Find Best Mandi">
                        <MapPin className="h-4 w-4" />
                      </Link>
                    </div>
                  )},
                ]}
                data={data.lots}
                keyExtractor={(row) => row.id}
                rowClassName={(row) => row.status === 'SOLD' ? 'opacity-50' : ''}
                emptyMessage="No lots published yet. Create your first lot!"
              />
            ) : (
              <p className="text-center text-gray-500 py-8">No lots published yet. Create your first lot!</p>
            )}
          </CardContent>
        </section>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link to="/market">
          <Button variant="secondary" className="gap-2">
            Compare Market Prices
          </Button>
        </Link>
        <Link to="/recommend">
          <Button variant="secondary" className="gap-2">
            Find Best Mandi
          </Button>
        </Link>
      </div>
    </div>
  );
}