import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

export default function ErrorBoundary({ children }: Props) {
  return <>{children}</>;
}
 