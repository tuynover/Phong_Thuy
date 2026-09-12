import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomSelect from '../components/CustomSelect';

describe('CustomSelect Component', () => {
    const mockOptions = [
        { value: 'ty', label: 'Tý (23h - 01h)' },
        { value: 'suu', label: 'Sửu (01h - 03h)' },
        { value: 'dan', label: 'Dần (03h - 05h)' },
        { value: 'mao', label: 'Mão (05h - 07h)' },
    ];

    it('should render with placeholder when no value is selected', () => {
        render(<CustomSelect options={mockOptions} placeholder="Chọn giờ sinh..." onChange={() => {}} />);
        expect(screen.getByText('Chọn giờ sinh...')).toBeInTheDocument();
    });

    it('should display selected option label based on value', () => {
        render(<CustomSelect options={mockOptions} value="suu" onChange={() => {}} />);
        expect(screen.getByText('Sửu (01h - 03h)')).toBeInTheDocument();
    });

    it('should open dropdown when main select button is clicked', () => {
        render(<CustomSelect options={mockOptions} value="ty" onChange={() => {}} />);
        
        const mainButton = screen.getAllByRole('button')[0];
        fireEvent.click(mainButton);

        expect(screen.getByText('Dần (03h - 05h)')).toBeInTheDocument();
        expect(screen.getByText('Mão (05h - 07h)')).toBeInTheDocument();
    });

    it('should trigger onChange callback with selected value and close dropdown', () => {
        const handleChange = vi.fn();
        render(<CustomSelect options={mockOptions} value="ty" onChange={handleChange} />);

        const mainButton = screen.getAllByRole('button')[0];
        fireEvent.click(mainButton);

        const targetOption = screen.getByText('Mão (05h - 07h)');
        fireEvent.click(targetOption);

        expect(handleChange).toHaveBeenCalledWith('mao');
    });

    it('should close dropdown when clicking outside', () => {
        render(
            <div>
                <div data-testid="outside">Outside area</div>
                <CustomSelect options={mockOptions} value="ty" onChange={() => {}} />
            </div>
        );

        const mainButton = screen.getAllByRole('button')[0];
        fireEvent.click(mainButton);
        expect(screen.getByText('Dần (03h - 05h)')).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByTestId('outside'));
        expect(screen.queryByText('Dần (03h - 05h)')).not.toBeInTheDocument();
    });
});
