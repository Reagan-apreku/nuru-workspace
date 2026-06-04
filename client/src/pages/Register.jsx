import { SignUp } from '@clerk/react';

export default function Register() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      <div
        className="animate-fade-in-up"
        style={{
          textAlign: 'center',
          marginBottom: 48,
          opacity: 0,
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 56,
            fontWeight: 300,
            letterSpacing: '0.04em',
            color: 'var(--color-text-primary)',
            marginBottom: 16,
          }}
        >
          Nuru Workspace
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--color-text-muted)',
            fontWeight: 300,
            letterSpacing: '0.04em',
          }}
        >
          Create your account to get started.
        </p>
      </div>

      <div
        className="animate-fade-in-up"
        style={{
          width: '100%',
          maxWidth: 420,
          opacity: 0,
          animationDelay: '0.15s',
        }}
      >
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/login"
          afterSignUpUrl="/dashboard"
          appearance={{
            layout: {
              socialButtonsPlacement: 'bottom',
            },
          }}
        />
      </div>

      <p
        className="animate-fade-in"
        style={{
          marginTop: 60,
          fontSize: 12,
          color: 'var(--color-text-faint)',
          letterSpacing: '0.04em',
          opacity: 0,
          animationDelay: '0.3s',
        }}
      >
        Photographer access only
      </p>
    </div>
  );
}
