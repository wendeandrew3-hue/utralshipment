import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [number, setNumber] = useState('');

  async function track(e: React.FormEvent) {
    e.preventDefault();
    if (!number.trim()) return;
    navigate(`/track?number=${encodeURIComponent(number.trim())}`);
  }

  const services = [
    ['Air Freight', 'Fast airport-to-airport forwarding for time-sensitive cargo.'],
    ['Sea Freight', 'Cost-effective FCL and LCL container shipping worldwide.'],
    ['Road Transport', 'Reliable first and last mile trucking across regions.'],
    ['Express Delivery', 'Priority door-to-door parcels with tight deadlines.'],
    ['International Logistics', 'Customs brokerage and multi-modal supply chains.'],
  ];

  return (
    <div>
      {/* Hero: one headline, one action */}
      <section className="border-b border-slate-200 bg-navy-900 py-16 text-white md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="font-display text-3xl font-extrabold md:text-5xl">
            Global shipping, tracked end to end.
          </h1>
          <form onSubmit={track} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              className="input !border-transparent sm:flex-1"
              placeholder="Enter tracking number (e.g. UTS...)"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              aria-label="Tracking number"
            />
            <button className="btn-accent font-bold">
              Track Shipment
            </button>
          </form>
          <p className="mt-5 text-sm text-slate-300">
            Need an account? <Link to="/register" className="font-semibold text-accent">Register here</Link> to see all your shipments in one place.
          </p>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="section-title">What we move</h2>
        <p className="mt-3 max-w-2xl text-slate-600">Five core services, one tracking platform. Whatever the mode, you follow your cargo the whole way.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {services.map(([title, desc]) => (
            <div key={title} className="card p-6 transition hover:shadow-md">
              <h3 className="font-display text-lg font-bold text-navy-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              <Link to="/services" className="mt-4 inline-block text-sm font-semibold text-accent-dark hover:underline">
                Learn more →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Proof points */}
      <section className="bg-navy-100 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3">
          {[
            ['Live tracking', 'Every lookup hits our real database. If it isn\'t in the system, we say so.'],
            ['Transparent charges', 'Any customs or shipping fee is documented on your shipment record.'],
            ['Support that answers', 'Call +1 201-603-2142, email, or chat with Abigail right from the site.'],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="font-display text-lg font-bold text-navy-900">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="card flex flex-col items-center gap-4 bg-navy-800 p-10 text-center text-white">
          <h2 className="font-display text-2xl font-extrabold md:text-3xl">Shipping something soon?</h2>
          <p className="max-w-xl text-sm text-slate-200">Register a free account to keep your shipments, documents and charges in one secure place.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-accent">Create Account</Link>
            <a href="tel:+12016032142" className="btn-outline !border-white/30 !text-white hover:!bg-white/10">Call Support</a>
          </div>
        </div>
      </section>
    </div>
  );
}
