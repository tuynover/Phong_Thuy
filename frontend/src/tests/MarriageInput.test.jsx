import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MarriageInput from '../features/marriage/MarriageInput';

describe('MarriageInput Component Flow Tests', () => {
    it('renders input sections for both male and female partners', () => {
        render(<MarriageInput onComplete={() => {}} />);
        expect(screen.getByText(/Thông Tin Nam Mệnh/i)).toBeInTheDocument();
        expect(screen.getByText(/Thông Tin Nữ Mệnh/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Lập Lá Số Hợp Hôn/i })).toBeInTheDocument();
    });

    it('disables submit button initially when date inputs are empty', () => {
        render(<MarriageInput onComplete={() => {}} />);
        const submitBtn = screen.getByRole('button', { name: /Lập Lá Số Hợp Hôn/i });
        expect(submitBtn).toBeDisabled();
    });

    it('renders date and time input placeholders for both partners', () => {
        render(<MarriageInput onComplete={() => {}} />);
        const dayInputs = screen.getAllByPlaceholderText('Ngày');
        expect(dayInputs).toHaveLength(2);

        const monthInputs = screen.getAllByPlaceholderText('Tháng');
        expect(monthInputs).toHaveLength(2);

        const yearInputs = screen.getAllByPlaceholderText('Năm');
        expect(yearInputs).toHaveLength(2);
    });
});
