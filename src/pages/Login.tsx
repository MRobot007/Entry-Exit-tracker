import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authenticateWithGoogle, isOAuth2Authenticated } from '@/lib/googleSheets';
import { Shield, Building2, LogIn } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authed = await isOAuth2Authenticated();
        if (authed) {
          navigate('/dashboard');
          return;
        }
      } finally {
        setChecking(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      setAuthenticating(true);
      const result = await authenticateWithGoogle();
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (e) {
      // noop: authenticateWithGoogle handles errors internally
    } finally {
      setAuthenticating(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p>Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-slate-800 flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              Campus Entry Management
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-slate-600">
            <p className="mb-4">Securely sign in with Google to manage student registrations and track entry/exit activities.</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Register students and generate QR codes</li>
              <li>Scan QR for fast entry/exit logging</li>
              <li>Offline-first with automatic sync</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="text-xl">Sign in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGoogleLogin}
              disabled={authenticating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-lg text-base"
            >
              <LogIn className="w-5 h-5 mr-2" />
              {authenticating ? 'Signing in...' : 'Continue with Google'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">By continuing, you agree to our acceptable use policy.</p>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-4 inset-x-0 flex justify-center">
        <div className="inline-flex items-center gap-2 text-slate-600 text-sm bg-white/70 backdrop-blur px-3 py-1 rounded-md border">
          <Building2 className="w-4 h-4" />
          Official College Portal
        </div>
      </div>
    </div>
  );
};

export default Login;