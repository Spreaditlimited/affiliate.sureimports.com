export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="dashboard-page-heading"><div><p className="section-kicker">{eyebrow}</p><h1>{title}</h1><span>{description}</span></div></header>;
}
