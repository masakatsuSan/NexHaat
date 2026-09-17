import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buyerRequirementApi, farmerApi } from '@/api';
import { createRequirementSchema, type CreateRequirementFormData } from '@/utils/validators';
import { CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button, Input, Select } from '@/components/ui';
import { Badge } from '@/components/ui';
import { formatCurrency, formatNumber, getStatusBadgeVariant } from '@/utils/formatters';
import { QUALITY_GRADES, type QualityGradeOption } from '@/utils/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Loader2, Edit, Trash2, CheckCircle, XCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface BuyerRequirement {
  id: string;
  crop: string;
  quantity_quintals: number;
  quality_grade: 'Grade-A' | 'Grade-B' | 'Grade-C';
  location: string;
  offered_price_per_quintal: number;
  status: 'OPEN' | 'CLOSED';
  created_at: string;
  updated_at: string;
  buyer_name?: string;
  buyer_district?: string;
  buyer_state?: string;
}

interface FarmerLot {
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

export function BuyerDashboard() {
  const { state } = useAuth();
  const [myRequirements, setMyRequirements] = useState<BuyerRequirement[]>([]);
  const [farmerLots, setFarmerLots] = useState<FarmerLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateRequirementFormData> & { status?: 'OPEN' | 'CLOSED' }>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRequirementFormData>({
    resolver: zodResolver(createRequirementSchema),
    defaultValues: {
      crop: '',
      quantity: 0,
      quality: 'Grade-A',
      location: '',
      price: 0,
    },
  });

  const fetchData = async () => {
    try {
      const [mineRes, lotsRes] = await Promise.all([
        buyerRequirementApi.getMine(),
        farmerApi.getMyLots(),
      ]);
      setMyRequirements(mineRes.requirements);
      setFarmerLots(lotsRes.lots);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onCreate = async (data: CreateRequirementFormData) => {
    setSubmitting(true);
    try {
      await buyerRequirementApi.create({
        crop: data.crop,
        quantity: data.quantity,
        quality: data.quality,
        location: data.location,
        price: data.price,
      });
      toast.success('Requirement posted successfully');
      reset();
      setShowPostForm(false);
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post requirement';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (req: BuyerRequirement) => {
    setEditingId(req.id);
    setEditForm({
      crop: req.crop,
      quantity: req.quantity_quintals,
      quality: req.quality_grade,
      location: req.location,
      price: req.offered_price_per_quintal,
      status: req.status,
    });
  };

  const onUpdate = async (id: string) => {
    try {
      await buyerRequirementApi.update(id, editForm);
      toast.success('Requirement updated');
      setEditingId(null);
      setEditForm({});
      fetchData();
    } catch (error) {
      toast.error('Failed to update requirement');
    }
  };

  const onClose = async (id: string) => {
    if (!confirm('Close this requirement?')) return;
    try {
      await buyerRequirementApi.close(id);
      toast.success('Requirement closed');
      fetchData();
    } catch (error) {
      toast.error('Failed to close requirement');
    }
  };

  const totalQuantity = myRequirements.reduce((sum, r) => sum + r.quantity_quintals, 0);
  const openCount = myRequirements.filter(r => r.status === 'OPEN').length;

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
          <a href="/buyer/dashboard" className="font-medium text-green">My Dashboard</a>
          <a href="/buyer/requirements" className="font-medium text-gray-600 hover:text-green">Requirements</a>
          <a href="/market" className="font-medium text-gray-600 hover:text-green">Market Prices</a>
          <a href="/profile" className="font-medium text-gray-600 hover:text-green">Profile</a>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-green hover:underline">Sign out</button>
        </nav>
      </header>

      <p className="eyebrow mb-2">BUYER DASHBOARD</p>
      <h1 className="text-3xl font-bold text-ink mb-6">Welcome back, {state.user?.name || 'Buyer'}</h1>

      <div className="stats-grid mb-8">
        <article className="stat-card">
          <span className="stat-label">Open Requirements</span>
          <strong className="stat-value">{openCount}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Total Quantity</span>
          <strong className="stat-value">{formatNumber(totalQuantity)} q</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Farmer Lots Available</span>
          <strong className="stat-value">{farmerLots.length}</strong>
        </article>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <section className="card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Post a Requirement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showPostForm ? (
              <form onSubmit={handleSubmit(onCreate as (data: CreateRequirementFormData) => Promise<void>)} className="space-y-4 md:grid md:grid-cols-2 md:gap-4">
                <Input label="Crop" placeholder="e.g. Tomato" {...register('crop')} error={errors.crop?.message} />
                <Input label="Quantity (quintals)" type="number" step="0.1" placeholder="e.g. 100" {...register('quantity')} error={errors.quantity?.message} />
                <Select label="Quality" options={QUALITY_GRADES as unknown as readonly QualityGradeOption[]} {...register('quality')} error={errors.quality?.message} />
                <Input label="Delivery Location" placeholder="e.g. Pune" {...register('location')} error={errors.location?.message} />
                <div className="md:col-span-2">
                  <Input label="Offer Price / Quintal" type="number" min="1" placeholder="e.g. 2800" {...register('price')} error={errors.price?.message} />
                </div>
                <div className="md:col-span-2 flex gap-4">
                  <Button type="submit" size="lg" loading={submitting}>Post Requirement</Button>
                  <Button type="button" variant="secondary" onClick={() => { reset(); setShowPostForm(false); }}>Cancel</Button>
                </div>
              </form>
            ) : (
              <Button onClick={() => setShowPostForm(true)} className="w-full sm:w-auto">
                <Plus className="h-5 w-5" />
                Post New Requirement
              </Button>
            )}
          </CardContent>
        </section>

        <section className="card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Available Farmer Lots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {farmerLots.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {farmerLots.map((lot) => (
                  <div key={lot.id} className="border border-line rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-ink">{lot.crop} — {formatNumber(lot.quantity)} q</p>
                        <p className="text-sm text-gray-500">{lot.quality} · {lot.location}</p>
                      </div>
                      <div className="text-right">
                        {lot.expected_price && <p className="text-sm text-green font-medium">{formatCurrency(lot.expected_price)}/q expected</p>}
                        <Badge variant={getStatusBadgeVariant(lot.status)} className="text-xs">{lot.status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No farmer lots available currently.</p>
            )}
          </CardContent>
        </section>
      </div>

      <section className="card">
        <CardHeader>
          <CardTitle>My Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          {myRequirements.length > 0 ? (
            <div className="space-y-3">
              {myRequirements.map((req) => (
                <div key={req.id} className="border border-line rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-ink">{req.crop} · {formatNumber(req.quantity_quintals)} quintals</h3>
                      <Badge variant={getStatusBadgeVariant(req.status)}>{req.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {req.quality_grade} · {req.location} · Offer {formatCurrency(req.offered_price_per_quintal)}/quintal
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {req.status === 'OPEN' && editingId !== req.id && (
                      <Button variant="ghost" size="sm" onClick={() => startEdit(req)}>
                        <Edit className="h-4 w-4" /> Edit
                      </Button>
                    )}
                    {editingId === req.id ? (
                      <>
                        <Input type="text" placeholder="Crop" value={editForm.crop || ''} onChange={(e) => setEditForm({ ...editForm, crop: e.target.value })} className="w-40" />
                        <Input type="number" step="0.1" placeholder="Qty" value={editForm.quantity || ''} onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) || 0 })} className="w-28" />
                        <Select options={QUALITY_GRADES as unknown as readonly QualityGradeOption[]} value={editForm.quality || 'Grade-A'} onChange={(e) => setEditForm({ ...editForm, quality: e.target.value as 'Grade-A' | 'Grade-B' | 'Grade-C' })} className="w-36" />
                        <Input type="text" placeholder="Location" value={editForm.location || ''} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} className="w-40" />
                        <Input type="number" min="1" placeholder="Price" value={editForm.price || ''} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) || 0 })} className="w-28" />
                        <Select options={[{ value: 'OPEN', label: 'Open' }, { value: 'CLOSED', label: 'Closed' }]} value={editForm.status || 'OPEN'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'OPEN' | 'CLOSED' })} className="w-28" />
                        <Button size="sm" onClick={() => onUpdate(req.id)}><CheckCircle className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditForm({}); }}><XCircle className="h-4 w-4" /></Button>
                      </>
                    ) : (
                      req.status === 'OPEN' && (
                        <Button variant="danger" size="sm" onClick={() => onClose(req.id)}><Trash2 className="h-4 w-4" /> Close</Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No requirements posted yet. Create your first requirement above!</p>
          )}
        </CardContent>
      </section>
    </div>
  );
}