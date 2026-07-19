import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import Loading from '@/app/loading';

// The route-level loading skeleton lets Next.js stream a first paint
// while the server component waits on the jobs query.
describe('root loading skeleton', () => {
  test('renders the page skeleton', () => {
    const html = renderToStaticMarkup(<Loading />);

    expect(html).toContain('data-testid="page-skeleton"');
    expect(html).toContain('animate-pulse');
  });

  test('matches the real page background to avoid a flash on swap', () => {
    const html = renderToStaticMarkup(<Loading />);

    expect(html).toContain('bg-gray-100 dark:bg-gray-900');
  });
});
