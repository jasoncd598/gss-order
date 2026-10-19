export function LegalTitle({ title, updated }: { title: string; updated: string }) {
  return (
    <div className="pb-5 mb-2 border-b border-zinc-300">
      <h1 className="font-display text-4xl text-zinc-950 leading-tight">{title}</h1>
      <p className="text-xs text-zinc-600 mt-2">Last updated {updated}</p>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-zinc-950 pt-4">{children}</h2>;
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

/** "email us at x" — falls back to the invoice wording until BUSINESS_EMAIL is set */
export function ContactLine({ email, name }: { email: string; name: string }) {
  return email
    ? <>email <a href={`mailto:${email}`} className="text-amber-800 underline">{email}</a></>
    : <>contact {name} using the details on your invoice</>;
}
