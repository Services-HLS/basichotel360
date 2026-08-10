import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/storage';
import Layout from '@/components/Layout';
import Footer from '@/components/Footer';

type LegalPageShellProps = {
  children: React.ReactNode;
};

/** Uses app Layout when logged in; otherwise a simple public page with back-to-login. */
export default function LegalPageShell({ children }: LegalPageShellProps) {
  const user = getCurrentUser();
  const token = localStorage.getItem('authToken');

  if (user && token) {
    return <Layout>{children}</Layout>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
