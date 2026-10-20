import { es } from '../i18n/es';
import { PageHead } from '../components/PageHead';

export function Stats() {
  return (
    <div className="page">
      <PageHead title={es.stats.title} />
    </div>
  );
}
