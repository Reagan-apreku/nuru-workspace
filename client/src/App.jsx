import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  Show,
  RedirectToSignIn,
  useAuth,
  useUser,
} from '@clerk/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { setAuthInterceptor } from './lib/api';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ClientsTab from './pages/ClientsTab';
import FeedbackTab from './pages/FeedbackTab';
import EmailTab from './pages/EmailTab';
import ClientForm from './pages/ClientForm';
import Success from './pages/Success';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import TrialExpired from './pages/TrialExpired';
import { useTrialStatus } from './hooks/useTrialStatus';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

/**
 * Protected route wrapper — redirects to login if not authenticated.
 */
function ProtectedRoute({ children }) {
  return (
    <>
      <Show when="signed-in">{children}</Show>
      <Show when="signed-out">
        <Navigate to="/login" replace />
      </Show>
    </>
  );
}

/**
 * Onboarding gate — redirects to onboarding if not completed.
 * Checks Clerk user metadata first, then falls back to localStorage.
 */
function OnboardingGate({ children }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;

  const metaComplete = user?.unsafeMetadata?.onboardingComplete;
  const localComplete = localStorage.getItem('nuru_onboarding_complete') === 'true';

  if (!metaComplete && !localComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

/**
 * Trial gate — redirects to upgrade page if trial has expired.
 * Pro users and active trial users pass through.
 */
function TrialGate({ children }) {
  const { isLoaded, isExpired } = useTrialStatus();

  if (!isLoaded) return null;

  if (isExpired) {
    return <Navigate to="/trial-expired" replace />;
  }

  return children;
}

/**
 * Sets up the Clerk auth interceptor for API calls.
 */
function AuthSetup({ children }) {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthInterceptor(getToken);
  }, [getToken]);

  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthSetup>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login/*" element={<Login />} />
            <Route path="/sign-up/*" element={<Register />} />

            {/* Onboarding — protected but no onboarding gate */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            {/* Trial expired paywall */}
            <Route
              path="/trial-expired"
              element={
                <ProtectedRoute>
                  <TrialExpired />
                </ProtectedRoute>
              }
            />

            {/* Protected Dashboard Routes — with onboarding + trial gate */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <OnboardingGate>
                    <TrialGate>
                      <Dashboard />
                    </TrialGate>
                  </OnboardingGate>
                </ProtectedRoute>
              }
            >
              <Route index element={<ClientsTab />} />
              <Route path="feedback" element={<FeedbackTab />} />
              <Route path="email" element={<EmailTab />} />
            </Route>

            {/* Client routes */}
            <Route
              path="/new-client"
              element={
                <ProtectedRoute>
                  <OnboardingGate>
                    <TrialGate>
                      <ClientForm />
                    </TrialGate>
                  </OnboardingGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/success"
              element={
                <ProtectedRoute>
                  <OnboardingGate>
                    <TrialGate>
                      <Success />
                    </TrialGate>
                  </OnboardingGate>
                </ProtectedRoute>
              }
            />

            {/* Profile — accessible even with expired trial so user can manage account */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <OnboardingGate>
                    <Profile />
                  </OnboardingGate>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthSetup>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
