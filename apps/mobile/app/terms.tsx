import { Stack } from 'expo-router';
import { LegalDocument } from '../components/LegalDocument';
import { TERMS_OF_SERVICE_MD } from '../lib/legal-documents';

export default function TermsPage() {
  return (
    <>
      <Stack.Screen options={{ title: 'Terms of Service', headerShown: false }} />
      <LegalDocument markdown={TERMS_OF_SERVICE_MD} />
    </>
  );
}
