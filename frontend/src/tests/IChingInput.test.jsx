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

    it('Mai Hoa sub-methods: renders SIM, Biển Số, 3 Số and Seri Tiền tabs', () => {
        render(
            <IChingInput 
                question="Hỏi việc" 
                setQuestion={() => {}} 
                onComplete={() => {}} 
                loading={false} 
            />
        );

        fireEvent.click(screen.getByText('Mai Hoa Dịch'));
        expect(screen.getByText('Giờ Động Tâm')).toBeInTheDocument();
        expect(screen.getByText('SIM')).toBeInTheDocument();
        expect(screen.getByText('Biển Số')).toBeInTheDocument();
        expect(screen.getByText('3 Số')).toBeInTheDocument();
        expect(screen.getByText('Seri Tiền')).toBeInTheDocument();
    });

    it('Mai Hoa SIM method calculates correctly and calls onComplete', () => {
        const handleComplete = vi.fn();
        render(
            <IChingInput 
                question="Xem SIM hợp mệnh không" 
                setQuestion={() => {}} 
                onComplete={handleComplete} 
                loading={false} 
            />
        );

        fireEvent.click(screen.getByText('Mai Hoa Dịch'));
        fireEvent.click(screen.getByText('SIM'));

        const input = screen.getByPlaceholderText(/Nhập 10 chữ số/i);
        fireEvent.change(input, { target: { value: '0912345678' } });

        expect(screen.getByText(/Mai Hoa Dịch Số theo SIM Điện Thoại/i)).toBeInTheDocument();
        expect(screen.getByText(/Thượng Quái \(5 số đầu\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Hạ Quái \(5 số cuối\)/i)).toBeInTheDocument();

        const submitBtn = screen.getByRole('button', { name: /Lập Quẻ Mai Hoa/i });
        expect(submitBtn).not.toBeDisabled();
        fireEvent.click(submitBtn);

        expect(handleComplete).toHaveBeenCalledTimes(1);
        const [lines, , methodSuffix] = handleComplete.mock.calls[0];
        expect(lines).toHaveLength(6);
        expect(methodSuffix).toContain('SIM 0912345678');
    });

    it('Mai Hoa Biển Số method calculates with 3 first digits upper, 2 last lower', () => {
        const handleComplete = vi.fn();
        render(
            <IChingInput 
                question="Xem biển số xe" 
                setQuestion={() => {}} 
                onComplete={handleComplete} 
                loading={false} 
            />
        );

        fireEvent.click(screen.getByText('Mai Hoa Dịch'));
        fireEvent.click(screen.getByText('Biển Số'));

        const input = screen.getByPlaceholderText(/Nhập 5 chữ số/i);
        fireEvent.change(input, { target: { value: '68688' } });

        expect(screen.getByText(/Mai Hoa Dịch Số theo Biển Số Xe/i)).toBeInTheDocument();
        expect(screen.getByText(/Thượng Quái \(3 số đầu\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Hạ Quái \(2 số sau\)/i)).toBeInTheDocument();

        const submitBtn = screen.getByRole('button', { name: /Lập Quẻ Mai Hoa/i });
        expect(submitBtn).not.toBeDisabled();
        fireEvent.click(submitBtn);

        expect(handleComplete).toHaveBeenCalledTimes(1);
        const [lines, , methodSuffix] = handleComplete.mock.calls[0];
        expect(lines).toHaveLength(6);
        expect(methodSuffix).toContain('Biển Số Xe 68688');
    });

    it('Mai Hoa 3 Số method calculates with 1st digit upper, sum of 2nd+3rd lower', () => {
        const handleComplete = vi.fn();
        render(
            <IChingInput 
                question="Xem 3 số may mắn" 
                setQuestion={() => {}} 
                onComplete={handleComplete} 
                loading={false} 
            />
        );

        fireEvent.click(screen.getByText('Mai Hoa Dịch'));
        fireEvent.click(screen.getByText('3 Số'));

        const input = screen.getByPlaceholderText(/Ví dụ: 168/i);
        fireEvent.change(input, { target: { value: '168' } });

        expect(screen.getByText(/Mai Hoa Dịch Số theo 3 Số/i)).toBeInTheDocument();
        expect(screen.getByText(/Thượng Quái \(Số đầu tiên\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Hạ Quái \(Tổng 2 số sau\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Hào Động \(Tổng cả 3 số\)/i)).toBeInTheDocument();

        const submitBtn = screen.getByRole('button', { name: /Lập Quẻ Mai Hoa/i });
        expect(submitBtn).not.toBeDisabled();
        fireEvent.click(submitBtn);

        expect(handleComplete).toHaveBeenCalledTimes(1);
        const [lines, , methodSuffix] = handleComplete.mock.calls[0];
        expect(lines).toHaveLength(6);
        expect(methodSuffix).toContain('3 Số [168]');
    });

    it('Mai Hoa 3 Số random generator button populates input', () => {
        render(
            <IChingInput 
                question="Gieo ngẫu nhiên" 
                setQuestion={() => {}} 
                onComplete={() => {}} 
                loading={false} 
            />
        );

        fireEvent.click(screen.getByText('Mai Hoa Dịch'));
        fireEvent.click(screen.getByText('3 Số'));

        const randomBtn = screen.getByRole('button', { name: /Tạo 3 số ngẫu nhiên/i });
        fireEvent.click(randomBtn);

        const input = screen.getByPlaceholderText(/Ví dụ: 168/i);
        expect(input.value).toMatch(/^\d{3}$/);
    });
});
