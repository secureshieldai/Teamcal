import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { startForegroundStepSync } from '../services/stepSync';

export default function StepSyncManager() {
  const { isAuthenticated } = useAuth();
  useEffect(() => isAuthenticated ? startForegroundStepSync() : undefined, [isAuthenticated]);
  return null;
}
