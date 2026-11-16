import { render, screen } from '@testing-library/react-native';

import { formatViewerCount, LivePill } from '../live-pill';

describe('formatViewerCount', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1K'],
    [1243, '1.2K'],
    [1_500_000, '1.5M'],
  ])('formats %d as %s', (input, expected) => {
    expect(formatViewerCount(input)).toBe(expected);
  });
});

describe('LivePill', () => {
  it('labels the viewer count for screen readers', async () => {
    await render(<LivePill viewerCount={1243} />);
    expect(screen.getByLabelText('Live, 1.2K watching')).toBeTruthy();
  });

  it('works without a viewer count', async () => {
    await render(<LivePill />);
    expect(screen.getByLabelText('Live')).toBeTruthy();
  });
});
