export default function About() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="section-title">About Utralshipment</h1>
      <div className="mt-6 max-w-3xl space-y-5 leading-relaxed text-slate-600">
        <p>
          Utralshipment is a shipping and logistics company built around one promise: you always know where your cargo is.
          Our platform connects air, sea and road freight into a single tracking experience from registration to delivery.
        </p>
        <p>
          Every shipment in our system is a real record created by our operations team. Every tracking lookup you make checks
          the live database, and every charge on your shipment is documented by staff, never invented.
        </p>
        <p>
          Our support team, led by Abigail on live chat, is available to help with bookings, holds, customs questions and
          delivery exceptions at +1 201-603-2142 and Utralshipment@gmail.com.
        </p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {[['End to end', 'Registration to delivery in one timeline'], ['Transparent', 'Charges documented on the record'], ['Accountable', 'Support staff with names, not bots']].map(([t, d]) => (
          <div key={t} className="card p-6">
            <h2 className="font-display font-bold text-navy-900">{t}</h2>
            <p className="mt-2 text-sm text-slate-600">{d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
