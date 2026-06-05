import Link from "next/link";

export function StoreCard({
  name,
  slug,
  city,
  openEvents,
}: {
  name: string;
  slug: string;
  city: string;
  openEvents: { name: string; slug: string; type: string }[];
}) {
  return (
    <li className="sub-panel rounded-xl p-4">
      <Link href={`/t/${slug}`} className="block">
        <p className="font-bold text-sky-50">{name}</p>
        {city && <p className="text-xs text-sky-100/50">{city}</p>}
      </Link>
      {openEvents.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t border-sky-500/15 pt-3">
          {openEvents.map((ev) => (
            <li key={ev.slug}>
              <Link
                href={`/e/${ev.slug}`}
                className="text-sm text-sky-300 underline"
              >
                {ev.name}
              </Link>
              <span className="ml-2 text-xs text-sky-100/40">{ev.type}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-sky-100/40">Sin torneos abiertos</p>
      )}
    </li>
  );
}
