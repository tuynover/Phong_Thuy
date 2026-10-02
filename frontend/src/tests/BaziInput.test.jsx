import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BaziInput from '../features/bazi/BaziInput';

describe('BaziInput Component Flow Tests', () => {
    it('renders the Bazi input form with calendar mode tabs and inputs', () => {
        render(<BaziInput onComplete={() => {}} />);
        expect(screen.getByText(/Nhập Thông Tin Bát Tự/i)).toBeInTheDocument();
        expect(screen.getByText('Dương lịch')).toBeInTheDocument();
        expect(screen.getByText('Âm lịch')).toBeInTheDocument();
        expect(screen.getByText('Thủ công')).toBeInTheDocument();
    });

    it('switches between calendar modes', () => {
        render(<BaziInput onComplete={() => {}} />);
        const lunarBtn = screen.getByText('Âm lịch');
        fireEvent.click(lunarBtn);
        expect(lunarBtn).toHaveClass('bg-white');

        const manualBtn = screen.getByText('Thủ công');
        fireEvent.click(manualBtn);
        expect(manualBtn).toHaveClass('bg-white');
    });

    it('toggles gender selection between Nam and Nữ', () => {
        render(<BaziInput onComplete={() => {}} />);
        const nuOption = screen.getByText(/Nữ Mệnh/i);
        fireEvent.click(nuOption);
        expect(nuOption).toBeInTheDocument();
    });

    it('disables submit button when required fields are empty', () => {
        render(<BaziInput onComplete={() => {}} />);
        const submitBtn = screen.getByRole('button', { name: /Lập Lá Số & Phân Tích/i });
        expect(submitBtn).toBeDisabled();
    });

    it('allows entering name and updates input value', () => {
        render(<BaziInput onComplete={() => {}} />);
        const nameInput = screen.getByPlaceholderText(/Nhập họ và tên/i);
        fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn A' } });
        expect(nameInput.value).toBe('Nguyễn Văn A');
    });
});
