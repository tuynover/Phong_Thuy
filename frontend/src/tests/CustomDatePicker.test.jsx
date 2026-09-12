import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomDatePicker from '../components/CustomDatePicker';

describe('CustomDatePicker Component (AGENTS.md Rule 2.2 Compliance)', () => {
    it('should NEVER render a native browser input[type="date"]', () => {
        const { container } = render(<CustomDatePicker value="2026-09-12" onChange={() => {}} />);
        const nativeDateInput = container.querySelector('input[type="date"]');
        expect(nativeDateInput).toBeNull();
    });

    it('should format and display date as DD/MM/YYYY', () => {
        render(<CustomDatePicker value="2026-09-12" onChange={() => {}} />);
        expect(screen.getByText('12/09/2026')).toBeInTheDocument();
    });

    it('should toggle calendar dropdown on trigger button click', () => {
        render(<CustomDatePicker value="2026-09-12" onChange={() => {}} />);
        
        expect(screen.queryByTestId('datepicker-dropdown')).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId('datepicker-trigger'));
        expect(screen.getByTestId('datepicker-dropdown')).toBeInTheDocument();
        expect(screen.getByText(/Tháng 9 - 2026/i)).toBeInTheDocument();
    });

    it('should navigate months when clicking next/prev month buttons', () => {
        render(<CustomDatePicker value="2026-09-12" onChange={() => {}} />);
        fireEvent.click(screen.getByTestId('datepicker-trigger'));

        expect(screen.getByText(/Tháng 9 - 2026/i)).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('next-month'));
        expect(screen.getByText(/Tháng 10 - 2026/i)).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('prev-month'));
        expect(screen.getByText(/Tháng 9 - 2026/i)).toBeInTheDocument();
    });

    it('should call onChange with formatted YYYY-MM-DD when date cell is selected', () => {
        const handleChange = vi.fn();
        render(<CustomDatePicker value="2026-09-12" onChange={handleChange} />);
        
        fireEvent.click(screen.getByTestId('datepicker-trigger'));

        // Click day 15 in current month
        const day15Button = screen.getAllByRole('button', { name: '15' })[0];
        fireEvent.click(day15Button);

        expect(handleChange).toHaveBeenCalledWith('2026-09-15');
        expect(screen.queryByTestId('datepicker-dropdown')).not.toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', () => {
        render(
            <div>
                <div data-testid="outside-area">Outside</div>
                <CustomDatePicker value="2026-09-12" onChange={() => {}} />
            </div>
        );

        fireEvent.click(screen.getByTestId('datepicker-trigger'));
        expect(screen.getByTestId('datepicker-dropdown')).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByTestId('outside-area'));
        expect(screen.queryByTestId('datepicker-dropdown')).not.toBeInTheDocument();
    });
});
