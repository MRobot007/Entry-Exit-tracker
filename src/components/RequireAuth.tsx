import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isOAuth2Authenticated } from '@/lib/googleSheets';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const authed = await isOAuth2Authenticated();
        if (!authed) {
          navigate('/');
          return;
        }
        setAllowed(true);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p>Checking access...</p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;
  return <>{children}</>;
};

export default RequireAuth;