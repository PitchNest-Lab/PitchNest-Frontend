import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import LegalLayout from '../../components/LegalLayout';
import { CONTACT_EMAIL, MIN_AGE, LEGAL_LAST_UPDATED } from '../../lib/legal';

export default function Support() {
  return (
    <LegalLayout title="Support" lastUpdated={LEGAL_LAST_UPDATED}>
      <p>
        Need help with PitchNest? We&apos;re here for account issues, pitch sessions, privacy questions,
        and account deletion.
      </p>

      <h2>Contact us</h2>
      <p>
        Email:{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-1.5 font-bold">
          <Mail size={16} />
          {CONTACT_EMAIL}
        </a>
      </p>
      <p>We aim to respond within 2–3 business days.</p>

      <h2>Common topics</h2>
      <ul>
        <li><strong>Login or password:</strong> use Forgot Password on the login screen.</li>
        <li><strong>Delete account:</strong> Settings → Account → Delete Account, or our{' '}
          <Link to="/delete-account">Delete Account</Link> page.</li>
        <li><strong>Privacy:</strong> see our <Link to="/privacy">Privacy Policy</Link>.</li>
        <li><strong>Terms:</strong> see our <Link to="/terms">Terms of Service</Link>.</li>
        <li><strong>AI feedback:</strong> all investor personas and scores are AI-generated—not real VCs or financial advice.</li>
      </ul>

      <h2>Age requirement</h2>
      <p>PitchNest is intended for users age {MIN_AGE} and older. The app contains no violence or profanity.</p>
    </LegalLayout>
  );
}
