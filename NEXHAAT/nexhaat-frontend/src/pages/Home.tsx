import { Link } from 'react-router-dom';
import { Tractor, BarChart2, MapPin, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

const features = [
  {
    icon: Tractor,
    title: 'Simple Registration',
    description: 'OTP-based login with phone number. No passwords to remember. Register as a Farmer or Buyer in minutes.',
  },
  {
    icon: BarChart2,
    title: 'Post Produce Lots',
    description: 'List your harvest with crop, quantity, quality grade, and location. Track all your active listings in one place.',
  },
  {
    icon: Shield,
    title: 'Price Trend Analysis',
    description: 'Analyze historical price data to know whether to sell now or wait for better prices. Rolling-average trend detection.',
  },
  {
    icon: MapPin,
    title: 'Compare Mandi Prices',
    description: 'Real-time mandi prices from Agmarknet (data.gov.in) with cached fallback. Filter by crop, state, and district.',
  },
  {
    icon: Shield,
    title: 'Smart Mandi Recommendations',
    description: 'Get the best mandi for your produce based on net profit after transport costs (₹4/km). GPS-powered distance calculation.',
  },
];

const steps = [
  { number: '01', title: 'Register', description: 'Enter your phone number, verify OTP, and complete your profile.' },
  { number: '02', title: 'Post Your Lot', description: 'Add crop details, quantity, quality grade, and expected price.' },
  { number: '03', title: 'Compare & Decide', description: 'View mandi prices, get recommendations, and choose the best market.' },
  { number: '04', title: 'Maximize Profit', description: 'Sell at the mandi offering the highest net realization after transport.' },
];

export function Home() {
  return (
    <>
      <section className="hero min-h-[80vh] flex items-center justify-center text-center px-4">
        <div className="max-w-4xl">
          <p className="eyebrow mb-4">NEXHAAT</p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[0.95] text-ink mb-6">
            Bring your harvest<br />
            <span className="text-green">to the right market.</span>
          </h1>
          <p className="lead text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            NexHaat gives farmers a simple place to register, publish a produce lot,
            compare mandi prices, and find the best market for maximum profit.
          </p>
          <div className="actions flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Register as a Farmer
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="actions flex flex-col sm:flex-row gap-4 justify-center items-center mt-6">
            <Link to="/market">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                Compare Market Prices
              </Button>
            </Link>
            <Link to="/recommend">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto gap-2">
                Find Best Mandi
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <p className="eyebrow mb-2">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold text-ink">Simple 4-step process</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center p-6">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-green/10 text-green flex items-center justify-center font-bold text-2xl mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-ink mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4 bg-cream">
        <div className="container">
          <div className="text-center mb-16">
            <p className="eyebrow mb-2">FEATURES</p>
            <h2 className="text-3xl md:text-4xl font-bold text-ink">Built for farmers, designed for profit</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-6">
                <div className="w-12 h-12 rounded-lg bg-green/10 text-green flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-ink mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="container text-center">
          <p className="eyebrow mb-2">READY TO START?</p>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mb-6">Join thousands of farmers using NexHaat</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Registration takes less than 2 minutes. No upfront costs. Transparent pricing.
            Start getting better prices for your harvest today.
          </p>
          <Link to="/signup">
            <Button size="lg" className="gap-2">
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}