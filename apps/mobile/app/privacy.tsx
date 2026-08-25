import { Stack } from 'expo-router';
import { LegalDocument } from '../components/LegalDocument';
import { PRIVACY_POLICY_MD } from '../lib/legal-documents';

export default function PrivacyPage() {
  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy', headerShown: false }} />
      <LegalDocument markdown={PRIVACY_POLICY_MD} />
    </>
  );
}
