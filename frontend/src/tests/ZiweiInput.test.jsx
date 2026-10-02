import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ZiweiInput from '../features/ziwei/ZiweiInput';

describe('ZiweiInput Component Flow Tests', () => {
    it('renders the Ziwei input form and calendar mode selector', () => {
        render(<ZiweiInput onSubmit={() => {}} />);
        expect(screen.getByText(/Nhập Thông Tin Tử Vi/i)).toBeInTheDocument();
        expect(screen.getByText('Dương lịch')).toBeInTheDocument();
        expect(screen.getByText('Âm lịch')).toBeInTheDocument();
    });

    it('renders "Xem Lá Số Của Bản Thân" button when activeUser is passed', () => {
        const handleViewOwnZiwei = vi.fn();
        render(
            <ZiweiInput 
                onSubmit={() => {}} 
                activeUser={{ id: 'user-1', name: 'Test User' }} 
                handleViewOwnZiwei={handleViewOwnZiwei} 
            />
        );

        const ownChartBtn = screen.getByRole('button', { name: /Xem Lá Số Của Bản Thân/i });
        expect(ownChartBtn).toBeInTheDocument();
        fireEvent.click(ownChartBtn);
        expect(handleViewOwnZiwei).toHaveBeenCalledTimes(1);
    });

    it('does not render "Xem Lá Số Của Bản Thân" button when activeUser is null', () => {
        render(<ZiweiInput onSubmit={() => {}} activeUser={null} />);
        expect(screen.queryByRole('button', { name: /Xem Lá Số Của Bản Thân/i })).not.toBeInTheDocument();
    });

    it('switches between calendar modes in Ziwei input', () => {
        render(<ZiweiInput onSubmit={() => {}} />);
        const lunarBtn = screen.getByText('Âm lịch');
        fireEvent.click(lunarBtn);
        expect(lunarBtn).toHaveClass('bg-white');
    });

    it('toggles gender selection in Ziwei input', () => {
        render(<ZiweiInput onSubmit={() => {}} />);
        const nuOption = screen.getByText(/Nữ Mệnh/i);
        fireEvent.click(nuOption);
        expect(nuOption).toBeInTheDocument();
    });

    it('disables submit button initially', () => {
        render(<ZiweiInput onSubmit={() => {}} />);
        const submitBtn = screen.getByRole('button', { name: /Lập Lá Số & Xem Giải Đoán/i });
        expect(submitBtn).toBeDisabled();
    });
});
