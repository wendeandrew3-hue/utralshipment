import { Link } from 'react-router-dom';

const services = [
  ['Air Freight', 'Fast airport-to-airport and door-to-door air forwarding for urgent, high-value or time-sensitive cargo. Daily capacity on major trade lanes.'],
  ['Sea Freight', 'Cost-effective ocean shipping with Full Container Load (FCL) and Less than Container Load (LCL) options to and from major ports worldwide.'],
  ['Road Transport', 'Dependable trucking for first and last mile connections, cross-border haulage and inland distribution.'],
  ['Express Delivery', 'Priority door-to-door parcels for documents and small packages with tight deadlines and full tracking visibility.'],
  ['International Logistics', 'Multi-modal supply chains, customs brokerage and documentation handled by our operations team from origin to destination.'],
];

export default function Services() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="section-title">Our services</h1>
      <p className="mt-3 max-w-2xl text-slate-600">One platform for every mode. Your shipment is tracked the same way whatever route it takes.</p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {services.map(([title, desc]) => (
          <div key={title} className="card p-7">
            <h2 className="font-display text-xl font-bold text-navy-900">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{desc}</p>
          </div>
        ))}
        <div className="card flex flex-col justify-center gap-3 bg-navy-800 p-7 text-white">
          <h2 className="font-display text-xl font-bold">Ready to ship?</h2>
          <p className="text-sm text-slate-200">Register a customer account, then our team will book your shipment and register it into the tracking system.</p>
          <Link to="/register" className="btn-accent self-start">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
