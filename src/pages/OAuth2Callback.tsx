import { useEffect } from 'react';
import { handleOAuth2Callback } from '@/lib/googleSheets';

const OAuth2Callback = () => {
  useEffect(() => {
    handleOAuth2Callback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p>Completing Google authentication...</p>
        <p className="text-sm text-muted-foreground mt-2">This window will close automatically</p>
      </div>
    </div>
  );
};

export default OAuth2Callback; 