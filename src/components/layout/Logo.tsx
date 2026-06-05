import Image from "next/image";
import Link from "next/link";

type LogoSize = "sm" | "md" | "lg";

const sizes: Record<LogoSize, { box: string; img: number }> = {
  sm: { box: "h-10 w-9", img: 40 },
  md: { box: "h-14 w-12", img: 56 },
  lg: { box: "h-[4.75rem] w-[3.25rem]", img: 76 },
};

interface LogoProps {
  size?: LogoSize;
  showName?: boolean;
  subtitle?: string;
  href?: string | null;
  className?: string;
}

export function Logo({
  size = "md",
  showName = true,
  subtitle,
  href = "/",
  className = "",
}: LogoProps) {
  const { box, img } = sizes[size];

  const content = (
    <>
      <div className={`relative shrink-0 overflow-visible ${box}`}>
        <Image
          src="/substitute-hero.png"
          alt="Substitute List"
          fill
          className="object-contain object-center drop-shadow-[0_0_16px_rgba(56,189,248,0.5)]"
          sizes={`${img}px`}
          priority
        />
      </div>
      {showName && (
        <div className="min-w-0">
          <p className="sub-glow-text text-base font-bold tracking-tight text-sky-300">
            Substitute List
          </p>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-sky-100/55">{subtitle}</p>
          )}
        </div>
      )}
    </>
  );

  if (href === null || href === undefined) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>{content}</div>
    );
  }

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 transition-opacity hover:opacity-90 ${className}`}
    >
      {content}
    </Link>
  );
}
