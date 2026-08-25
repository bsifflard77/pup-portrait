import { Stack } from 'expo-router';
import { LegalHoldPage } from '../components/LegalDocument';

export default function TermsPage() {
  return (
    <>
      <Stack.Screen options={{ title: 'Terms of Service', headerShown: false }} />
      <LegalHoldPage
        title="Terms of Service"
        officialUrl="https://monomoystrategies.com/terms"
      />
    </>
  );
}
