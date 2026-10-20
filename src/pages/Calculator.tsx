import { es } from '../i18n/es';
import { PageHead } from '../components/PageHead';

export function Calculator() {
  return (
    <div className="page">
      <PageHead title={es.calculator.title} />
    </div>
  );
}
