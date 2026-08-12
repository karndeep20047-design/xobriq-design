import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard(props: Props) {
  const { title, subtitle, children, footer } = props;
  return (
    <div>
      <div className="mb-8 flex justify-center">
        <Link href="/" aria-label="Xobriq home" className="inline-flex">
          <Image
            src="/xobriq-logo-horizontal.png"
            alt="Xobriq"
            width={360}
            height={120}
            priority
            className="h-16 w-auto object-contain"
          />
        </Link>
      </div>
      <div className="glass-panel rounded-2xl p-6 sm:p-10">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
          <p className="text-sm text-enterprise-fg-muted">{subtitle}</p>
        </div>
        <div className="mt-8">{children}</div>
      </div>
      {footer ? (<div className="mt-6 text-center text-sm text-enterprise-fg-muted">{footer}</div>) : null}
    </div>
  );
}
