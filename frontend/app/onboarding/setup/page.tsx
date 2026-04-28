import { Suspense } from 'react';
import SetupClient from './SetupClient';

// Wrap any `useSearchParams()` usage in Suspense to satisfy Next.js prerendering rules.
export default function OnboardingSetupPage() {
    return (
        <Suspense fallback={<div className="max-w-2xl mx-auto py-10 px-4" />}>
            <SetupClient />
        </Suspense>
    );
}
