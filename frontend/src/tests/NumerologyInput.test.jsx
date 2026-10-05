import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NumerologyInput from '../features/numerology/NumerologyInput';
import { AuthContext } from '../context/AuthContext';

const mockUser = {
  id: 'user-123',
  name: 'Nguyễn Văn A',
  gender: 1,
  baziInfo: {
    year: 1995,
    month: 8,
    day: 18,
    hour: 9,
    minute: 30
  }
};

describe('NumerologyInput Component Tests', () => {
  it('renders target tabs and default sim input', () => {
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <NumerologyInput onSubmit={vi.fn()} isLoading={false} />
      </AuthContext.Provider>
    );

    expect(screen.getByText('Sim Số')).toBeInTheDocument();
    expect(screen.getByText('Biển Số Xe')).toBeInTheDocument();
    expect(screen.getByText('Số Tài Khoản')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ví dụ: 0988199199')).toBeInTheDocument();
  });

  it('validates sim number length strictly (rejects < 10 digits)', () => {
    const handleSubmit = vi.fn();
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <NumerologyInput onSubmit={handleSubmit} isLoading={false} />
      </AuthContext.Provider>
    );

    const input = screen.getByPlaceholderText('Ví dụ: 0988199199');
    fireEvent.change(input, { target: { value: '098812345' } }); // 9 digits
    fireEvent.click(screen.getByText('Khảo Sát Số Học'));

    expect(screen.getByText(/Số điện thoại \(Sim\) yêu cầu nhập đủ đúng 10 chữ số/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('validates license plate strictly (requires exactly 5 digits)', () => {
    const handleSubmit = vi.fn();
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <NumerologyInput onSubmit={handleSubmit} isLoading={false} />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText('Biển Số Xe'));
    const input = screen.getByPlaceholderText(/59123/i);
    fireEvent.change(input, { target: { value: '5912' } }); // 4 digits
    fireEvent.click(screen.getByText('Khảo Sát Số Học'));

    expect(screen.getByText(/Biển số xe yêu cầu nhập đủ đúng 5 chữ số/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('populates user info when clicking "Sử Dụng Thông Tin Bản Thân" in Bazi mode', () => {
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <NumerologyInput onSubmit={vi.fn()} isLoading={false} />
      </AuthContext.Provider>
    );

    // Switch to Bazi mode
    fireEvent.click(screen.getByText('Xem Phối Bát Tự'));

    // Check calendar mode switch
    expect(screen.getByText('Dương lịch')).toBeInTheDocument();
    expect(screen.getByText('Âm lịch')).toBeInTheDocument();

    // Click auto fill button
    const selfInfoBtn = screen.getByText('Sử Dụng Thông Tin Bản Thân');
    fireEvent.click(selfInfoBtn);

    // Verify day, month, year, hour, minute values
    const dayInput = screen.getByPlaceholderText('DD');
    const monthInput = screen.getByPlaceholderText('MM');
    const yearInput = screen.getByPlaceholderText('YYYY');
    const hourInput = screen.getByPlaceholderText('HH');
    const minInput = screen.getByPlaceholderText('Min');

    expect(dayInput.value).toBe('18');
    expect(monthInput.value).toBe('8');
    expect(yearInput.value).toBe('1995');
    expect(hourInput.value).toBe('09');
    expect(minInput.value).toBe('30');
  });
});
