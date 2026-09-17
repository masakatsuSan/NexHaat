import { Link, Outlet } from 'react-router-dom';
import { Footer } from './Layout';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-line">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="brand text-xl font-extrabold tracking-wide text-green" aria-label="NexHaat Home">
              NEXHAAT
            </Link>
            <Link to="/" className="text-green font-medium hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md"><Outlet /></div>
      </main>
      <Footer />
    </div>
  );
}