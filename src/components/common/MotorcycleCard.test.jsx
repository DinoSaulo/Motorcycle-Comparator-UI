import { describe, expect, it, beforeEach, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, screen } from '../../testing/test-utils';
import { buildMotorcycle } from '../../testing/fixtures';
import { EMPTY_VALUE } from '../../utils/formatters';
import MotorcycleCard from './MotorcycleCard';

function renderCard(props = {}) {
  const motorcycle = props.motorcycle ?? buildMotorcycle();
  return {
    motorcycle,
    onToggle: props.onToggle,
    ...renderWithProviders(
      <MotorcycleCard
        motorcycle={motorcycle}
        selected={props.selected ?? false}
        disabled={props.disabled ?? false}
        onToggle={props.onToggle ?? vi.fn()}
      />,
    ),
  };
}

describe('MotorcycleCard', () => {
  beforeEach(() => {
    window.localStorage.setItem('motorcycle-comparator.language', 'en');
  });

  it('falls back to brand and model when the API has no display name', () => {
    renderCard();
    expect(screen.getByRole('heading', { name: 'Yamaha MT-07' })).toBeInTheDocument();
  });

  it('prefers the explicit display name when the API published one', () => {
    renderCard({ motorcycle: buildMotorcycle({ displayName: 'Yamaha MT-07 (2024)' }) });
    expect(screen.getByRole('heading', { name: 'Yamaha MT-07 (2024)' })).toBeInTheDocument();
  });

  it('links through to the motorcycle detail page', () => {
    renderCard();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/motorcycles/1');
  });

  it('shows the localised category badge and the model year', () => {
    renderCard();

    expect(screen.getByText('Naked')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('shows the formatted engine size, power and price', () => {
    renderCard();

    expect(screen.getByText('689 cc')).toBeInTheDocument();
    expect(screen.getByText('73.4 hp')).toBeInTheDocument();
    expect(screen.getByText('€8,299')).toBeInTheDocument();
  });

  it('renders an em dash for every unpublished figure, never a zero', () => {
    renderCard({
      motorcycle: buildMotorcycle({
        priceEur: null,
        engine: { displacementCc: null, maxPowerHp: null },
      }),
    });

    expect(screen.getAllByText(EMPTY_VALUE)).toHaveLength(3);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('survives a motorcycle with no engine block at all', () => {
    renderCard({ motorcycle: buildMotorcycle({ engine: null }) });
    expect(screen.getAllByText(EMPTY_VALUE).length).toBeGreaterThanOrEqual(2);
  });

  it('renders the resolved photo with the motorcycle name as alt text', () => {
    renderCard({ motorcycle: buildMotorcycle({ imageUrl: '/uploads/mt-07.jpg' }) });

    const image = screen.getByRole('img', { name: 'Yamaha MT-07' });
    expect(image).toHaveAttribute('src', expect.stringContaining('/uploads/mt-07.jpg'));
  });

  it('falls back to a decorative placeholder when there is no photo', () => {
    renderCard();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('offers an unpressed add action while the motorcycle is not selected', () => {
    renderCard();

    const button = screen.getByRole('button', { name: 'Add Yamaha MT-07 to comparison' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveTextContent('Compare');
  });

  it('flips the action to a pressed remove control once selected', () => {
    renderCard({ selected: true });

    const button = screen.getByRole('button', { name: 'Remove Yamaha MT-07 from comparison' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent('Selected');
  });

  it('reports the whole motorcycle when the action is used', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    const { motorcycle } = renderCard({ onToggle });

    await user.click(screen.getByRole('button'));

    expect(onToggle).toHaveBeenCalledWith(motorcycle);
  });

  it('blocks adding once the comparison is full', () => {
    renderCard({ disabled: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('still allows de-selecting a motorcycle inside a full comparison', () => {
    renderCard({ disabled: true, selected: true });
    expect(screen.getByRole('button')).toBeEnabled();
  });
});
