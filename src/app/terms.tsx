import { LegalDocumentScreen } from '../components/LegalDocumentScreen';
import { LEGAL_EFFECTIVE_DATE, TERMS_SECTIONS } from '../lib/legal';

export default function TermsScreen() {
  return <LegalDocumentScreen title="서비스 이용약관" effectiveDate={LEGAL_EFFECTIVE_DATE} sections={TERMS_SECTIONS} />;
}
