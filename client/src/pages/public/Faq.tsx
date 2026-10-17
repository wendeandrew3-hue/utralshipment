import { useState } from 'react';

const faqs = [
  ['How do I track my shipment?', 'Enter your tracking number in the tracking form on the homepage or the Track Shipment page. The result comes from our live database and shows the current status, full timeline, and any documented charges.'],
  ['Where do I get my tracking number?', 'You receive a tracking number when our team registers your shipment. If you have a customer account, all your shipments and their tracking numbers are listed in your portal.'],
  ['What does "On Hold" mean?', 'Your shipment is paused, for example at customs. The reason for the hold and any applicable documented charge is shown on the tracking page before anything is asked of you. Holds are only created by authorized staff.'],
  ['How are customs and other charges handled?', 'Every charge on a shipment is recorded by staff with a description and amount. You can see the charge and its payment status on your tracking page. Payment status is only marked as paid after we verify the payment on our side.'],
  ['I see "Delivery Exception". What now?', 'Something interrupted the delivery, such as an incorrect address or an issue at the destination. Contact support at +1 201-603-2142 or Utralshipment@gmail.com and we will explain the exact situation for your shipment.'],
  ['Is my data private?', 'Public tracking lookups only show limited, partially masked recipient details. Full details are visible only when you are signed in to the account that owns the shipment. Passwords are stored hashed and never in plain text.'],
  ['What are your support hours?', 'Phone support at +1 201-603-2142 is available for emergencies around the clock. Live chat with Abigail runs during business hours; when offline, leave a message and we will reply by email.'],
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="section-title">Frequently asked questions</h1>
      <div className="mt-10 space-y-3">
        {faqs.map(([q, a], i) => (
          <div key={i} className="card overflow-hidden">
            <button className="flex w-full items-center justify-between px-6 py-4 text-left" onClick={() => setOpen(open === i ? null : i)}>
              <span className="font-semibold text-navy-900">{q}</span>
              <span className="text-xl text-accent">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
