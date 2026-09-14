import { LegalDocumentScreen } from '../components/LegalDocumentScreen';
import { LEGAL_EFFECTIVE_DATE, PRIVACY_SECTIONS } from '../lib/legal';

export default function PrivacyScreen() {
  return <LegalDocumentScreen title="개인정보 처리방침" effectiveDate={LEGAL_EFFECTIVE_DATE} sections={PRIVACY_SECTIONS} />;
}
