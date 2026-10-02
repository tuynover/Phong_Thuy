import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IChingInput, { ManualInput } from '../features/iching/IChingInput';

describe('IChingInput Component Flow Tests', () => {
    it('renders the question textarea and mode selection tabs', () => {
        const setQuestion = vi.fn();
        render(
            <IChingInput 
                question="Công việc sắp tới thế nào?" 
                setQuestion={setQuestion} 
                onComplete={() => {}} 
                loading={false} 
            />
        );

        expect(screen.getByText(/Sự việc cần hỏi \(Ý niệm\)/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Công việc sắp tới thế nào?')).toBeInTheDocument();
        expect(screen.getByText('Gieo Đồng Xu')).toBeInTheDocument();
        expect(screen.getByText('Mai Hoa Dịch')).toBeInTheDocument();
        expect(screen.getByText('Nhập Thủ Công')).toBeInTheDocument();
    });

    it('switches between Gieo Đồng Xu, Mai Hoa Dịch, and Nhập Thủ Công tabs', () => {
        render(
            <IChingInput 
                question="" 
                setQuestion={() => {}} 
                onComplete={() => {}} 
                loading={false} 
            />
        );

        const maiHoaTab = screen.getByText('Mai Hoa Dịch');
        fireEvent.click(maiHoaTab);
        expect(screen.getByText(/Gieo Quẻ Mai Hoa Dịch Số/i)).toBeInTheDocument();

        const manualTab = screen.getByText('Nhập Thủ Công');
        fireEvent.click(manualTab);
        expect(screen.getByText(/Nhập Hào Thủ Công/i)).toBeInTheDocument();
    });

    it('shows loading state when loading is true', () => {
        render(
            <IChingInput 
                question="Hỏi việc" 
                setQuestion={() => {}} 
                onComplete={() => {}} 
                loading={true} 
            />
        );

        expect(screen.getByText(/Đang kết nối tâm linh.../i)).toBeInTheDocument();
    });

    it('ManualInput allows setting lines and calling onComplete', () => {
        const handleComplete = vi.fn();
        render(<ManualInput onComplete={handleComplete} />);

        expect(screen.getByText('Hào 1')).toBeInTheDocument();
        expect(screen.getByText('Hào 6')).toBeInTheDocument();

        const submitBtn = screen.getByRole('button', { name: /Lập Quẻ Nhanh/i });
        fireEvent.click(submitBtn);

        expect(handleComplete).toHaveBeenCalledTimes(1);
        expect(handleComplete.mock.calls[0][0]).toHaveLength(6);
    });
});
