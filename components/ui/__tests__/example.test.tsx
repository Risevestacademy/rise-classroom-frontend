// components/ui/__tests__/example.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('sanity check', () => {
  it('renders', () => {
    render(<div>Rise Classroom</div>);
    expect(screen.getByText('Rise Classroom')).toBeInTheDocument();
  });
});